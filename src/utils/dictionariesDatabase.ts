import Dexie, { Database } from 'dexie'
import { basename } from 'path'
import { getTableName, LexiconEntry } from '../files/dictionaryFile'
import { LETTERS_DIGITS_PLUS } from './dictCc'
import { lookUpDictCc } from './dictionaries/lookUpDictCc'
import { lookUpCeDict } from './dictionaries/lookUpCeDict'
import { lookUpYomichanJMDict } from './dictionaries/lookUpYomichanJMDict'
import { uuid } from './sideEffects'

const LATEST_DEXIE_DB_VERSION = 1

export const DICTIONARIES_TABLE = 'dictionaries'

const YOMICHAN_DICTIONARY: DictionaryFileType = 'YomichanDictionary'
const CEDICT_DICTIONARY: DictionaryFileType = 'CEDictDictionary'
const DICT_CC_DICTIONARY: DictionaryFileType = 'DictCCDictionary'

const dictionaryProp = (propertyName: keyof DictionaryFile) => propertyName
const prop = (propertyName: keyof LexiconEntry) => propertyName

/** remember to check defined */
let dexie: Dexie | null

export function getDexieDb() {
  if (dexie) return dexie

  dexie = new Dexie('DictionaryEntries')

  dexie.version(LATEST_DEXIE_DB_VERSION).stores({
    [DICTIONARIES_TABLE]: `++${dictionaryProp('key')}, ${dictionaryProp(
      'id'
    )}, ${dictionaryProp('type')}`,
    [YOMICHAN_DICTIONARY]: `++key, ${prop('head')}, ${prop(
      'pronunciation'
    )}, ${prop('dictionaryKey')}`,
    [CEDICT_DICTIONARY]: `++key, ${prop('head')}, ${prop(
      'pronunciation'
    )}, ${prop('dictionaryKey')}, ${prop('variant')}`,
    [DICT_CC_DICTIONARY]: `++key, ${prop('head')}, ${prop(
      'dictionaryKey'
    )}, *${prop('tokenCombos')}`,
  })

  return dexie
}

export async function newDictionary(
  db: Database,
  type: DictionaryFileType,
  filePath: string
) {
  const dicProps: Omit<DictionaryFile, 'key'> = {
    type,
    id: uuid(),
    name: basename(filePath),
    importComplete: false,
  }
  const key = await db.table(DICTIONARIES_TABLE).add(dicProps)
  const dic: DictionaryFile = {
    ...dicProps,
    key,
  }
  return dic
}

export type TranslatedTokensAtCharacterIndex = {
  textCharacterIndex: number
  /** To be sorted by length of matchedTokenText */
  translatedTokens: TranslatedToken[]
}
export type TranslatedToken = {
  matchedTokenText: string
  candidates: {
    entry: LexiconEntry
    inflections: string[]
  }[]
}

export type TextTokensTranslations = {
  tokensTranslations: TranslatedTokensAtCharacterIndex[]
  characterIndexToTranslationsMappings: Array<undefined | number>
}

export function lookUpInDictionary(
  dictionaryType: DictionaryFileType,
  text: string
): Promise<TextTokensTranslations> {
  switch (dictionaryType) {
    case 'YomichanDictionary':
      return lookUpYomichanJMDict(text)
    case 'DictCCDictionary':
      return lookUpDictCc(text)
    case 'CEDictDictionary':
      return lookUpCeDict(text)
  }
}

export const TOKEN_COMBOS: keyof LexiconEntry = 'tokenCombos'
export const HEAD: keyof LexiconEntry = 'head'
export const VARIANT: keyof LexiconEntry = 'variant'
export const PRONUNCIATION: keyof LexiconEntry = 'pronunciation'
export const KEY: keyof LexiconEntry = 'key'

type CJTextTokens = { index: number; tokens: string[] }[]
export function parseFlat(text: string, maxWordLength = 8) {
  let tokensByIndex: CJTextTokens = []
  let allTokens: Set<string> = new Set()
  if (!text) return { tokensByIndex, allTokens }

  const textSegments = wordIndexes(text)
  for (let { index: startIndex, string: sentence } of textSegments.filter(
    ({ index, string }) => string.length
  )) {
    for (let start = 0; start < sentence.length; ++start) {
      const tokensAtIndex: string[] = []
      tokensByIndex.push({ index: startIndex + start, tokens: tokensAtIndex })

      let maxCurrLength = sentence.length - start
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
  return match.map((v, i) => ({
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
  let result: {
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
    result.dictionaryDeletion = err
  }

  try {
    const record = await db
      .table(getTableName(type))
      .where(prop('dictionaryKey'))
      .equals(key)
      .first()

    if (record) {
      const allDictionariesOfType = allDictionaries.filter(d => d.type === type)
      if (allDictionariesOfType.length <= 1)
        await db.table(getTableName(type)).clear()
      else
        await db
          .table(getTableName(type))
          .where('dictionaryKey')
          .equals(key)
          .delete()
    }
  } catch (err) {
    result.entriesDeletion = err
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
