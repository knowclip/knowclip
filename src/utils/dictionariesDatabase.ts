import Dexie from 'dexie'
import { basename } from '../utils/rendererPathHelpers'
import { getTableName, LegacyLexiconEntry } from '../files/dictionaryFile'
import { LETTERS_DIGITS_PLUS } from './dictCc'
import { lookUpDictCc } from './dictionaries/lookUpDictCc'
import { lookUpCeDict } from './dictionaries/lookUpCeDict'
import { lookUpYomichanJMDict } from './dictionaries/lookUpYomichanJMDict'
import { lookUpYomitan } from './dictionaries/lookUpYomitan'
import {
  DatabaseKanjiEntry,
  DatabaseKanjiMeta,
  DatabaseTermEntry,
  DatabaseTermEntryWithId,
  DatabaseTermMeta,
  Tag,
} from '../vendor/yomitan/types/ext/dictionary-database'
import { YomitanMediaRecord } from './dictionaries/importYomitanEntries'
import { TranslatedTokensAtCharacterIndex } from './dictionaries/findTranslationsAtCharIndex'

// table names
export const DICTIONARIES_TABLE = 'dictionaries'
const YOMICHAN_DICTIONARY: DictionaryFileType = 'YomichanDictionary'
const CEDICT_DICTIONARY: DictionaryFileType = 'CEDictDictionary'
const DICT_CC_DICTIONARY: DictionaryFileType = 'DictCCDictionary'
export const YOMITAN_DICTIONARY_TERMS_TABLE = 'yomitan terms'
export const YOMITAN_DICTIONARY_TERMS_META_TABLE = 'yomitan terms meta'
export const YOMITAN_DICTIONARY_KANJI_TABLE = 'yomitan kanji'
export const YOMITAN_DICTIONARY_KANJI_META_TABLE = 'yomitan kanji meta'
export const YOMITAN_DICTIONARY_TAGS_TABLE = 'yomitan tags'
export const YOMITAN_DICTIONARY_MEDIA_TABLE = 'yomitan media'

const schema = <T>(
  ...propertyNames: keyof T extends string
    ? (keyof T | '++key' | '++id')[]
    : never
) => propertyNames.join(', ')

let dexie: Dexie | null

export function getDexieDb() {
  if (dexie) return dexie

  dexie = new Dexie('DictionaryEntries')
  const v1 = {
    [DICTIONARIES_TABLE]: schema<DictionaryFile>('++key', 'id', 'type'),
    [YOMICHAN_DICTIONARY]: schema<LegacyLexiconEntry>(
      '++key',
      'head',
      'pronunciation',
      'dictionaryKey'
    ),
    [CEDICT_DICTIONARY]: schema<LegacyLexiconEntry>(
      '++key',
      'head',
      'pronunciation',
      'dictionaryKey',
      'variant'
    ),
    [DICT_CC_DICTIONARY]: schema<LegacyLexiconEntry>(
      '++key',
      'head',
      'dictionaryKey',
      'tokenCombos'
    ),
    ['YomitanDictionary']: schema<LegacyLexiconEntry>(
      '++key',
      'head',
      'pronunciation',
      'dictionaryKey'
    ),
  }

  // prettier-ignore
  dexie.version(2).stores({
    ...v1,
    [DICTIONARIES_TABLE]: schema<DictionaryFile & YomitanDictionary>('++key', 'id', 'type', 'language', 'metadata'),
    [YOMITAN_DICTIONARY_TERMS_TABLE]: schema<DatabaseTermEntry>(
      '++id', 'expression', 'reading', 'expressionReverse', 'readingReverse', 'sequence', 'dictionary'
    ),
    [YOMITAN_DICTIONARY_TERMS_META_TABLE]: schema<DatabaseTermMeta>('++id', 'expression', 'dictionary'),
    [YOMITAN_DICTIONARY_KANJI_TABLE]: schema<DatabaseKanjiEntry>(
      '++id', 'character', 'dictionary'
    ),
    [YOMITAN_DICTIONARY_KANJI_META_TABLE]: schema<DatabaseKanjiMeta>('++id', 'character', 'dictionary'),
    [YOMITAN_DICTIONARY_TAGS_TABLE]: schema<Tag>(
      '++id', 'name', 'dictionary'
    ),
    [YOMITAN_DICTIONARY_MEDIA_TABLE]: schema<YomitanMediaRecord>('++id', 'dictionary', 'path')
  })

  dexie.version(1).stores(v1)

  return dexie
}

export async function newDictionary(
  db: Dexie,
  dictionary: CreateDictionarySpecs,
  filePath: string,
  id: string
): Promise<DictionaryFile> {
  const { platform } = window.electronApi
  const dicProps:
    | Omit<YomitanDictionary, 'key'>
    | Omit<Exclude<DictionaryFile, YomitanDictionary>, 'key'> =
    dictionary.dictionaryType === 'YomitanDictionary'
      ? {
          type: 'Dictionary',
          dictionaryType: 'YomitanDictionary',
          language: dictionary.language,
          id,
          name: basename(platform, filePath),
          // don't forget to update this
          importComplete: false,
          metadata: dictionary.metadata,
        }
      : {
          type: 'Dictionary',
          dictionaryType: dictionary.dictionaryType,
          id,
          name: basename(platform, filePath),
          importComplete: false,
        }
  const key = await db.table(DICTIONARIES_TABLE).add(dicProps)
  if (typeof key !== 'number')
    throw new Error('Dictionaries table key should be number')

  return { ...dicProps, key }
}

export type LexiconEntry = LegacyLexiconEntry | DatabaseTermEntryWithId

export type TokenTranslation<
  EntryType extends LexiconEntry = LexiconEntry,
  InflectionType = string[],
> = {
  entry: EntryType
  inflections?: InflectionType
}

export type TranslatedToken<
  EntryType extends LexiconEntry = LexiconEntry,
  InflectionType = string[],
> = {
  matchedTokenText: string
  matches: TokenTranslation<EntryType, InflectionType>[]
}

export type TextTokensTranslations<
  EntryType extends LexiconEntry,
  InflectionType = string[],
> = {
  tokensTranslations: TranslatedTokensAtCharacterIndex<
    EntryType,
    InflectionType
  >[]
  characterIndexToTranslationsMappings: Array<undefined | number>
}

export function lookUpInDictionary(
  dictionaryType: DictionaryFileType,
  activeDictionariesIds: Set<string>,
  text: string
):
  | Promise<TextTokensTranslations<LegacyLexiconEntry>>
  | ReturnType<typeof lookUpYomitan> {
  switch (dictionaryType) {
    case 'YomichanDictionary':
      return lookUpYomichanJMDict(text)
    case 'DictCCDictionary':
      return lookUpDictCc(text)
    case 'CEDictDictionary':
      return lookUpCeDict(text)
    case 'YomitanDictionary':
      return lookUpYomitan(activeDictionariesIds, text)
  }
}

export const TOKEN_COMBOS: keyof LegacyLexiconEntry = 'tokenCombos'
export const HEAD: keyof LegacyLexiconEntry = 'head'
export const VARIANT: keyof LegacyLexiconEntry = 'variant'
export const PRONUNCIATION: keyof LegacyLexiconEntry = 'pronunciation'
export const KEY: keyof LegacyLexiconEntry = 'key'

type CJTextTokens = { index: number; tokens: string[] }[]
export function parseFlat(text: string, maxWordLength = 8) {
  const tokensByIndex: CJTextTokens = []
  const allTokens: Set<string> = new Set()
  if (!text) return { tokensByIndex, allTokens }

  const textSegments = wordIndexes(text)
  for (const { index: startIndex, string: sentence } of textSegments.filter(
    ({ string }) => string.length
  )) {
    for (let start = 0; start < sentence.length; ++start) {
      const tokensAtIndex: string[] = []
      tokensByIndex.push({ index: startIndex + start, tokens: tokensAtIndex })

      const maxCurrLength = sentence.length - start
      for (
        let amount =
          maxWordLength <= maxCurrLength ? maxWordLength : maxCurrLength;
        amount > 0;
        --amount
      ) {
        const token = sentence.substr(start, amount)
        tokensAtIndex.push(token)
        allTokens.add(token)
      }

      tokensAtIndex.sort((a, b) => b.length - a.length) // TODO: check: this the right place?
    }
  }
  return { tokensByIndex, allTokens }
}
function wordIndexes(s: string) {
  const rx = LETTERS_DIGITS_PLUS
  const match = [...s.matchAll(rx)]
  return match.map((v) => ({
    string: v[0] as string,
    index: v.index as number,
  }))
}

export async function deleteDictionary(
  effects: EpicsDependencies,
  allDictionaries: DictionaryFile[],
  key: number,
  type: DictionaryFileType
) {
  const db = effects.getDexieDb()
  const result: {
    dictionaryDeletion: 'SUCCESS' | Error
    entriesDeletion: 'SUCCESS' | Error
  } = {
    dictionaryDeletion: 'SUCCESS',
    entriesDeletion: 'SUCCESS',
  }

  try {
    const record = await db.table(DICTIONARIES_TABLE).get(key)
    if (record) await db.table(DICTIONARIES_TABLE).delete(key)
  } catch (err) {
    result.dictionaryDeletion =
      err instanceof Error ? err : new Error(String(err))
  }

  try {
    const record = await db
      .table(getTableName(type))
      .where('dictionaryKey' satisfies keyof LegacyLexiconEntry)
      .equals(key)
      .first()

    if (record) {
      const allDictionariesOfType = allDictionaries.filter(
        (d) => d.dictionaryType === type
      )
      if (allDictionariesOfType.length <= 1)
        await db.table(getTableName(type)).clear()
      else
        await db
          .table(getTableName(type))
          .where('dictionaryKey' satisfies keyof LegacyLexiconEntry)
          .equals(key)
          .delete()
    }
  } catch (err) {
    result.entriesDeletion = err instanceof Error ? err : new Error(String(err))
  }

  return result
}

export async function resetDictionariesDatabase() {
  if (dexie) dexie.delete()

  dexie = null

  getDexieDb()
}

export function sortResult(a: boolean, b: boolean) {
  if (a && !b) return -1
  if (b && !a) return 1
}
