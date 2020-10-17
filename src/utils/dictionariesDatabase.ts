import Dexie, { Database } from 'dexie'
import { basename } from 'path'
import {
  getTableName,
  LexiconEntry,
  LexiconMainEntry,
} from '../files/dictionaryFile'
import {
  getDifferingSearchStem,
  LETTERS_DIGITS_PLUS,
  NON_LETTERS_DIGITS_PLUS,
} from './dictCc'
import { uuid } from './sideEffects'
import { getTokenCombinations } from './tokenCombinations'
import { lemmatize } from './yomichanDictionary'

const LATEST_DEXIE_DB_VERSION = 1

export const DICTIONARIES_TABLE = 'dictionaries'

const YOMICHAN_DICTIONARY: DictionaryFileType = 'YomichanDictionary'
const CEDICT_DICTIONARY: DictionaryFileType = 'CEDictDictionary'
const DICT_CC_DICTIONARY: DictionaryFileType = 'DictCCDictionary'

const dictionaryProp = (propertyName: keyof DictionaryFile) => propertyName
const prop = (propertyName: keyof LexiconEntry | (keyof LexiconMainEntry)) =>
  propertyName

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
    )}, ${prop('dictionaryKey')}`,
    // all these indexes takes too long to import maybe.
    // would it be ok with just the multi-entry indexes + search sped up with frequency
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
type TranslatedToken = {
  /** For whitespace languages, there
   * will only be one tokenText per textCharacterIndex.
   * So right now, for German `TranslatedTokensAtCharacterIndex.translatedTokens[n].matchedTokenText` will be the same.
   */
  matchedTokenText: string
  candidates: { entry: LexiconMainEntry; inflections: string[] }[]
}

type TextTokensTranslations = {
  tokensTranslations: TranslatedTokensAtCharacterIndex[]
  characterIndexToTranslationsMappings: Array<undefined | number>
}

export function lookUpInDictionary(
  dictionaryType: DictionaryFileType,
  text: string
): Promise<TextTokensTranslations> {
  switch (dictionaryType) {
    case 'YomichanDictionary':
      return lookUpJapanese(text)
    case 'DictCCDictionary':
      return lookUpGerman(text)
    case 'CEDictDictionary':
      throw 'unimplemented'
  }
}

// const SEARCH_TOKENS_SORTED: keyof LexiconMainEntry = 'searchTokensSorted'
// const SEARCH_STEMS_SORTED: keyof LexiconMainEntry = 'searchStemsSorted'
const TOKEN_COMBOS: keyof LexiconMainEntry = 'tokenCombos'
const MAX_GERMAN_SEARCH_TOKENS_COUNT = 5

const getGermanSearchTokensStrings = (searchStems: string[]) =>
  getTokenCombinations(
    searchStems.slice(0, MAX_GERMAN_SEARCH_TOKENS_COUNT).sort()
  ).map(tokenCombo => {
    return getTokenComboWithLengthString(tokenCombo, searchStems.length)
  })
function getTokenComboWithLengthString(tokenCombo: string[], length: number) {
  return [...tokenCombo.sort(), length.toString(16).padStart(2, '0')].join(' ')
}
function getGermanSearchTokensFromText(germanText: string) {
  const withoutAnnotations = germanText.trim().toLowerCase()
  const tokens = withoutAnnotations
    .split(NON_LETTERS_DIGITS_PLUS)
    .filter(x => x)
  return tokens
}
function getGermanTextSearchTokensCombos(tokens: string[]) {
  return getTokenCombinations(
    tokens.slice(0, MAX_GERMAN_SEARCH_TOKENS_COUNT)
  ).map(tokenCombo => {
    return getTokenComboWithLengthString(tokenCombo, tokenCombo.length)
  })
}
;(window as any).getGermanTextSearchTokensCombos = getGermanTextSearchTokensCombos
export function getGermanTextSearchStems(tokens: string[]) {
  const stems: string[] = []

  for (const word of tokens) {
    const stem = getDifferingSearchStem(word) || word
    stems.push(stem)
  }

  return stems
}

export async function lookUpGerman(
  text: string,
  maxQueryTokensLength: number = 5
): Promise<TextTokensTranslations> {
  console.log('lookign up!')

  if (!dexie)
    return {
      tokensTranslations: [],
      characterIndexToTranslationsMappings: [],
    }

  const textTokens = getGermanSearchTokensFromText(text)
  const textStems = getGermanTextSearchStems(textTokens)

  const table = dexie.table(getTableName('DictCCDictionary'))

  const allSearchStemsStrings = textStems.flatMap((stem, tokenIndex) => {
    const searchStems = textStems.slice(
      tokenIndex,
      tokenIndex + maxQueryTokensLength
    )
    const combos = getGermanTextSearchTokensCombos(searchStems)
    // console.log({tokenIndex,stem, searchStems, combos})
    return combos
  })
  console.log({ textStems, allSearchStemsStrings })

  const {
    exactStemsMatches,
    // , approxMatches
  } = await dexie.transaction('r', table, async () => {
    const exactStemsMatches = table
      .where(TOKEN_COMBOS)
      .anyOf(allSearchStemsStrings)
      .distinct()
      .toArray()
    return {
      exactStemsMatches: (await exactStemsMatches) as LexiconMainEntry[],
      // approxMatches: (await approxMatches).flatMap(x => x) as LexiconMainEntry[],
    }
  })

  console.log({
    exactStemsMatches: exactStemsMatches,
    exactCount: exactStemsMatches.length,
    // approxMatches: approxMatches.length
  })

  const results: TranslatedTokensAtCharacterIndex[] = []

  let indexingCursor = 0
  let tokenIndex = 0
  for (const exactToken of textTokens) {
    const searchTokens = textTokens.slice(
      tokenIndex,
      tokenIndex + maxQueryTokensLength
    )
    const searchStems = textStems.slice(
      tokenIndex,
      tokenIndex + maxQueryTokensLength
    )
    const tokenCombinationsAtIndex = getTokenCombinations(searchTokens)
    const stemCombinationsAtIndex = getTokenCombinations(searchStems)

    const tokenCharacterIndex = text
      .toLowerCase()
      .indexOf(exactToken, indexingCursor)
    const searchStemsAtIndex = stemCombinationsAtIndex.flatMap(stemCombo => {
      const stemComboString = stemCombo.sort().join(' ')
      // perhaps can use entry.tokenCombos first value instead of calling getGermanSearchTokens each time here?
      // except here we're testing "raw" tokens, not stems
      const exactMatches = exactStemsMatches.filter(entry => {
        // return getGermanSearchTokens(entry.head).sort().join(' ') === stemComboString
        return (
          entry.tokenCombos[0] ===
          stemComboString + ` ${stemCombo.length.toString(16).padStart(2, '0')}`
        )
      })
      return exactMatches
    })
    if (searchStemsAtIndex.length)
      results.push({
        textCharacterIndex: tokenCharacterIndex,
        translatedTokens: searchStemsAtIndex.map(
          (entry): TranslatedToken => ({
            matchedTokenText: exactToken,
            candidates: [{ entry: entry, inflections: [] }],
          })
        ),
      })

    indexingCursor = tokenCharacterIndex + exactToken.length - 1
    tokenIndex++
  }
  // should sort to prioritize
  // exact matches and matches
  // preserving the order parts corresponding to query tokens
  return {
    tokensTranslations: results,
    characterIndexToTranslationsMappings: [],
  }
}

const HEAD: keyof LexiconMainEntry = 'head'
const PRONUNCIATION: keyof LexiconMainEntry = 'pronunciation'

export async function lookUpJapanese(
  text: string
  // activeDictionaries: string[] ???
): Promise<TextTokensTranslations> {
  if (!dexie)
    return {
      tokensTranslations: [],
      characterIndexToTranslationsMappings: [],
    }
  const { tokensByIndex: potentialTokens, allTokens } = parseFlat(text)

  const allLookupTokens = Array.from(allTokens, token => [
    token,
    // maybe memoize lemmatize in this function
    ...lemmatize(token).map(t => t.text),
  ]).flat()
  const allQueries: LexiconMainEntry[] = await dexie
    .table(getTableName('YomichanDictionary'))
    .where(HEAD)
    .anyOf(allLookupTokens)
    .or(PRONUNCIATION)
    .anyOf(allLookupTokens)
    .distinct()
    .toArray()

  console.log(allQueries.length + ' total results!')

  const tokensTranslations = potentialTokens.flatMap(({ tokens, index }) => {
    const translatedTokens = tokens.flatMap(token => {
      const candidates = allQueries.flatMap(entry => {
        const exactMatch = entry.head === token || entry.pronunciation === token

        const posTags = entry.tags ? entry.tags.split(' ') : []
        return [
          ...(exactMatch ? [{ entry, inflections: [] }] : []),
          ...lemmatize(token).flatMap(potentialLemma => {
            const textIsMatching =
              // potentialLemma.text === entry.head  ||
              potentialLemma.text === entry.head ||
              potentialLemma.text === entry.pronunciation
            if (textIsMatching && entry.head.includes('表')) {
              console.log(
                {
                  entry: {
                    head: entry.head,
                    pronunciation: entry.pronunciation,
                    tags: entry.tags,
                    tagsSplit: posTags,
                  },
                },
                { potentialLemma }
              )
            }

            return textIsMatching &&
              potentialLemma.wordClasses.some(wc => posTags.includes(wc))
              ? [{ entry, inflections: potentialLemma.inferredInflections }]
              : []
          }),
        ]
      })

      const translatedTokensAtCharacterIndex: TranslatedToken[] = candidates.length
        ? [
            {
              matchedTokenText: token,
              candidates: candidates.sort((a, b) => {
                if (
                  [a.entry.head, b.entry.head].filter(head => head === token)
                    .length != 1
                ) {
                  const aScore =
                    typeof a.entry.frequencyScore === 'number'
                      ? a.entry.frequencyScore
                      : Infinity
                  const bScore =
                    typeof b.entry.frequencyScore === 'number'
                      ? b.entry.frequencyScore
                      : Infinity

                  const frequencyDifference = bScore - aScore
                  if (frequencyDifference) return frequencyDifference

                  const inflectionsDifference =
                    a.inflections.length - b.inflections.length
                  // if (inflectionsDifference)
                  return inflectionsDifference
                } else {
                  return a.entry.head === token ? -1 : 1
                }
              }),
            },
          ]
        : []
      return translatedTokensAtCharacterIndex
    })

    return translatedTokens.length
      ? [
          {
            textCharacterIndex: index,
            translatedTokens,
          },
        ]
      : []

    // TODO: fix "precise token hit"
    // e.g. in kusukusurawarau, mouseover warau should not give kusukusuwarau but warau.
  })
  return {
    tokensTranslations: tokensTranslations,
    characterIndexToTranslationsMappings: [],
  }
}

function wordIndexes(s: string) {
  // 々
  // const rx = /([^\uFF0C\uFE10\uFE50\u1F101-\u1F10A\u0000-\u007F\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F\u3200-\u32FF\u3300-\u33FF\uFE30-\uFE4F\u12400-\u1247F\u16FE0-\u16FFF \w\s]+)[\uFF0C\uFE10\uFE50\u1F101-\u1F10A\u0000-\u007F\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F\u3200-\u32FF\u3300-\u33FF\uFE30-\uFE4F\u12400-\u1247F\u16FE0-\u16FFF \w\s]*/gu
  const rx = LETTERS_DIGITS_PLUS
  const match = [...s.matchAll(rx)]
  return match.map((v, i) => ({
    string: v[0] as string,
    index: v.index as number,
  }))
}

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

      tokensAtIndex.sort((a, b) => b.length - a.length) // this the right place?
    }
  }
  return { tokensByIndex, allTokens }
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

  console.log('deleting dictionary!')
  try {
    const record = await db.table(DICTIONARIES_TABLE).get(key)
    console.log({ record })
    if (record) await db.table(DICTIONARIES_TABLE).delete(key)
  } catch (err) {
    result.dictionaryDeletion = err
  }

  console.log('deleting dictionary items!')
  try {
    const record = await db
      .table(getTableName(type))
      .where(prop('dictionaryKey'))
      .equals(key)
      .first()
    console.log({ record })

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

  console.log('done deleting dictionary!')

  return result
}

export async function resetDictionariesDatabase() {
  if (dexie) dexie.delete()

  dexie = null

  getDexieDb()
}
