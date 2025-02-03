import {
  DICTIONARIES_TABLE,
  getDexieDb,
  YOMITAN_DICTIONARY_KANJI_META_TABLE,
  YOMITAN_DICTIONARY_KANJI_TABLE,
  YOMITAN_DICTIONARY_MEDIA_TABLE,
  YOMITAN_DICTIONARY_TAGS_TABLE,
  YOMITAN_DICTIONARY_TERMS_META_TABLE,
  YOMITAN_DICTIONARY_TERMS_TABLE,
} from '../dictionariesDatabase'
import Ajv, { ErrorObject, ValidateFunction } from 'ajv'
import dictionaryIndexSchema from '../../vendor/yomitan/ext/data/schemas/dictionary-index-schema.json'
import dictionaryKanjiBankV1Schema from '../../vendor/yomitan/ext/data/schemas/dictionary-kanji-bank-v1-schema.json'
import dictionaryKanjiBankV3Schema from '../../vendor/yomitan/ext/data/schemas/dictionary-kanji-bank-v3-schema.json'
import dictionaryKanjiMetaBankV3Schema from '../../vendor/yomitan/ext/data/schemas/dictionary-kanji-meta-bank-v3-schema.json'
import dictionaryTagBankV3Schema from '../../vendor/yomitan/ext/data/schemas/dictionary-tag-bank-v3-schema.json'
import dictionaryTermBankV1Schema from '../../vendor/yomitan/ext/data/schemas/dictionary-term-bank-v1-schema.json'
import dictionaryTermBankV3Schema from '../../vendor/yomitan/ext/data/schemas/dictionary-term-bank-v3-schema.json'
import dictionaryTermMetaBankV3Schema from '../../vendor/yomitan/ext/data/schemas/dictionary-term-meta-bank-v3-schema.json'
import type {
  DatabaseKanjiEntry,
  DatabaseKanjiMeta,
  DatabaseTermEntry,
  DatabaseTermMeta,
  Tag,
} from '../../vendor/yomitan/types/ext/dictionary-database'
import { IndexableType } from 'dexie'
import { failure } from '../result'

const ajv = new Ajv()
const validatorCache = new Map<object, ValidateFunction>()
const validateDictionaryRecordsJson = (
  schema: object,
  { json, type }: Extract<YomitanArchiveEntry['data'], { json: object }>
): Result<
  {
    type: Extract<YomitanArchiveEntry['data'], { json: object }>['type']
    validated: object
  },
  ErrorObject[] | Error
> => {
  try {
    let validator = validatorCache.get(schema)
    if (!validator) {
      validator = ajv.compile(schema)
      validatorCache.set(schema, validator)
    }

    const valid = validator(json)
    if (!valid) {
      return validator.errors
        ? failure(validator.errors)
        : failure('Invalid JSON')
    }
    return { value: { type, validated: json } }
  } catch (error) {
    return failure(error)
  }
}

export type YomitanArchiveEntryType = YomitanArchiveEntry['data']['type']
/** should this have width/height as well? */
export type YomitanMediaRecord = {
  type: 'image'
  path: string
  mediaType: string
  content: Uint8Array
  dictionary: string
}

export type YomitanArchiveEntry = {
  dictionaryVersion: 1 | 2 | 3
  dictionaryId: string
  data:
    | {
        // prettier-ignore
        type: 'term_bank' | 'term_meta_bank' | 'kanji_bank' | 'kanji_meta_bank' | 'tag_bank' |'index'
        json: object
      }
    | {
        type: 'styles'
        text: string
      }
    | YomitanMediaRecord
}

export type YomitanDataOf<T extends YomitanArchiveEntryType> = Extract<
  YomitanArchiveEntry['data'],
  { type: T }
>

export async function importYomitanEntries(
  archiveEntry: YomitanArchiveEntry,
  file: YomitanDictionary
): Promise<IndexableType> {
  const validationResult = validateYomitanEntry(archiveEntry)
  console.log(
    'validationResult',
    validationResult,
    'archiveEntry',
    archiveEntry
  )
  if (validationResult.error) {
    throw validationResult.error
  }
  try {
    switch (validationResult.value.type) {
      case 'term_bank':
        return await getDexieDb()
          .table(YOMITAN_DICTIONARY_TERMS_TABLE)
          .bulkAdd(
            (validationResult.value.validated as any[]).map(
              (entry): DatabaseTermEntry =>
                archiveEntry.dictionaryVersion === 1
                  ? convertTermBankEntryV1(
                      entry as [],
                      archiveEntry.dictionaryId
                    )
                  : convertTermBankEntryV3(
                      entry as [],
                      archiveEntry.dictionaryId
                    )
            )
          )
      // TODO: check that validationresult value json is in the expected format for all record types below
      case 'term_meta_bank':
        return await getDexieDb()
          .table(YOMITAN_DICTIONARY_TERMS_META_TABLE)
          .bulkAdd(
            (validationResult.value.validated as any[]).map(
              ([expression, mode, data]): DatabaseTermMeta => {
                return {
                  expression,
                  mode,
                  data,
                  dictionary: file.id,
                }
              }
            )
          )
      case 'kanji_bank':
        return await getDexieDb()
          .table(YOMITAN_DICTIONARY_KANJI_TABLE)
          .bulkAdd(
            (validationResult.value.validated as any[]).map(
              ([
                character,
                onyomi,
                kunyomi,
                tags,
                meanings,
                stats,
              ]): DatabaseKanjiEntry => ({
                character,
                onyomi,
                kunyomi,
                tags,
                meanings,
                dictionary: file.id,
                stats,
              })
            )
          )
      case 'kanji_meta_bank':
        return await getDexieDb()
          .table(YOMITAN_DICTIONARY_KANJI_META_TABLE)
          .bulkAdd(
            (validationResult.value.validated as any[]).map(
              ([character, mode, data]): DatabaseKanjiMeta => {
                return {
                  character,
                  mode,
                  data,
                  dictionary: file.id,
                }
              }
            )
          )
      case 'tag_bank':
        return await getDexieDb()
          .table(YOMITAN_DICTIONARY_TAGS_TABLE)
          .bulkAdd(
            (validationResult.value.validated as any[]).map(
              ([name, category, order, notes, score]): Tag => ({
                name,
                category,
                order,
                notes,
                score,
                dictionary: file.id,
              })
            )
          )
      case 'image':
        return await getDexieDb()
          .table(YOMITAN_DICTIONARY_MEDIA_TABLE)
          .add(validationResult.value.validated satisfies YomitanMediaRecord)
      case 'index': {
        const currentMetadata = await getDexieDb()
          .table(DICTIONARIES_TABLE)
          .get(file.id)

        return await getDexieDb()
          .table(DICTIONARIES_TABLE)
          .update(file.id, {
            metadata: {
              ...(currentMetadata?.metadata || {}),
              indexJson: validationResult.value,
            },
          } satisfies Partial<DictionaryFile>)
      }
      case 'styles': {
        const currentMetadata = await getDexieDb()
          .table(DICTIONARIES_TABLE)
          .get(file.id)

        return await getDexieDb()
          .table(DICTIONARIES_TABLE)
          .update(file.id, {
            metadata: {
              ...(currentMetadata?.metadata || {}),
              stylesCss: validationResult.value,
            },
          } satisfies Partial<DictionaryFile>)
      }
    }
  } catch (error) {
    console.error(`Error importing ${archiveEntry.data.type} entries`, error)
    console.log('archiveEntry', archiveEntry)
    throw error
  }
}

function validateYomitanEntry({
  dictionaryVersion,
  data,
}: YomitanArchiveEntry):
  | ReturnType<typeof validateDictionaryRecordsJson>
  | Result<
      | {
          type: 'image'
          validated: YomitanMediaRecord
        }
      | { type: 'styles'; validated: string },
      ErrorObject[] | Error | 'Invalid JSON'
    > {
  switch (data.type) {
    case 'term_bank':
      return validateDictionaryRecordsJson(
        dictionaryVersion === 1
          ? dictionaryTermBankV1Schema
          : dictionaryTermBankV3Schema,
        data
      )
    case 'term_meta_bank':
      return validateDictionaryRecordsJson(dictionaryTermMetaBankV3Schema, data)
    case 'kanji_bank':
      return validateDictionaryRecordsJson(
        dictionaryVersion === 1
          ? dictionaryKanjiBankV1Schema
          : dictionaryKanjiBankV3Schema,
        data
      )
    case 'kanji_meta_bank':
      return validateDictionaryRecordsJson(
        dictionaryKanjiMetaBankV3Schema,
        data
      )
    case 'tag_bank':
      return validateDictionaryRecordsJson(dictionaryTagBankV3Schema, data)
    case 'index':
      return validateDictionaryRecordsJson(dictionaryIndexSchema, data)
    case 'styles':
      return { value: { type: data.type, validated: data.text } }
    case 'image':
      return { value: { type: data.type, validated: data } }
    default:
      return { error: 'Invalid JSON' }
  }
}

/**
 * @param {import('dictionary-data').TermV1} entry
 * @param {string} dictionary
 * @returns {import('dictionary-database').DatabaseTermEntry}
 */
function convertTermBankEntryV1(
  entry: any[],
  dictionary: string
): DatabaseTermEntry {
  const [expression, reading, definitionTags, rules, score, ...glossary] =
    entry as [any, string, ...any[]]
  return {
    expression,
    reading: reading.length > 0 ? reading : expression,
    definitionTags,
    rules,
    score,
    glossary,
    dictionary,
  } as DatabaseTermEntry
}

/**
 * @param {import('dictionary-data').TermV3} entry
 * @param {string} dictionary
 * @returns {import('dictionary-database').DatabaseTermEntry}
 */
function convertTermBankEntryV3(
  entry: any[],
  dictionary: string
): DatabaseTermEntry {
  const [
    expression,
    reading,
    definitionTags,
    rules,
    score,
    glossary,
    sequence,
    termTags,
  ] = entry as [any, string, ...any[]]
  // console.log('entry v3', entry, {
  //   expression,
  //   reading: reading.length > 0 ? reading : expression,
  //   definitionTags,
  //   rules,
  //   score,
  //   glossary,
  //   sequence,
  //   termTags,
  //   dictionary,
  // })
  return {
    expression,
    reading: reading.length > 0 ? reading : expression,
    definitionTags,
    rules,
    score,
    glossary,
    sequence,
    termTags,
    dictionary,
  } as DatabaseTermEntry
}
