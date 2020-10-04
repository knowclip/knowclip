import Dexie, { Database } from 'dexie'
import { basename } from 'path'
import { getTableName, LexiconMainEntry } from '../files/dictionaryFile'
import {
  getGermanSearchTokens,
  getGermanStems,
  LETTERS_DIGITS_PLUS,
  NON_LETTERS_DIGITS_PLUS,
  toSortedX,
} from './dictCc'
import { uuid } from './sideEffects'
import { getTokenCombinations } from './tokenCombinations'
import { lemmatize } from './yomichanDictionary'

const LATEST_DEXIE_DB_VERSION = 1

const DICTIONARIES_TABLE = 'dictionaries'

/** remember to check defined */
let dexie: Dexie

export function getDexieDb() {
  dexie = new Dexie('DictionaryEntries')

  dexie.version(LATEST_DEXIE_DB_VERSION).stores({
    [DICTIONARIES_TABLE]: '++key, id, type',
    YomichanDictionary: '++key, head, pronunciation, dictionaryKey',
    CEDictDictionary: '++key, head, pronunciation, dictionaryKey',
    // all these indexes takes too long to import maybe.
    // would it be ok with just the multi-entry indexes + search sped up with frequency
    DictCCDictionary:
      '++key, head, dictionaryKey, searchTokensSorted, *searchTokens, searchTokensCount, *searchStems, searchStemsSorted',
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
  }
  const key = await db.table(DICTIONARIES_TABLE).add(dicProps)
  const dic: DictionaryFile = {
    ...dicProps,
    key,
  }
  return dic
}

export type TokenTranslations = {
  index: number
  translatedTokens: {
    token: string
    candidates: { entry: LexiconMainEntry; inflections: string[] }[]
  }[]
}

export function lookUpInDictionary(
  dictionaryType: DictionaryFileType,
  text: string
) {
  switch (dictionaryType) {
    case 'YomichanDictionary':
      return lookUpJapanese(text)
    case 'DictCCDictionary':
      return lookUpGerman(text)
    case 'CEDictDictionary':
      throw 'unimplemented'
  }
}

const SEARCH_TOKENS_SORTED: keyof LexiconMainEntry = 'searchTokensSorted'
const SEARCH_STEMS_SORTED: keyof LexiconMainEntry = 'searchStemsSorted'

export async function lookUpGerman(
  text: string,
  maxQueryTokensLength: number = 5
): Promise<TokenTranslations[]> {
  ;(window as any).d = dexie

  if (!dexie) return []

  const textTokens = getGermanSearchTokens(text)
  const textStems = getGermanStems(text)

  const table = dexie.table(getTableName('DictCCDictionary'))

  const results: TokenTranslations[] = []

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
    const potentialParsingsAtIndex = getTokenCombinations(searchTokens)

    const tokenCharacterIndex = text
      .toLowerCase()
      .indexOf(exactToken, indexingCursor)

    const exactTokensMatches = (await Promise.all(
      getTokenCombinations(searchTokens).map(async parsing => {
        const searchValue = toSortedX(parsing)
        console.log({ searchValue })
        const lex: LexiconMainEntry[] = await table
          .where(SEARCH_TOKENS_SORTED)
          .equals(searchValue)
          .toArray()
        return lex
      })
    )).flatMap(x => x)
    const approxMatches =
      // should really always run this? or maybe exactTokensMatches lenght threshold?
      // should filter out candidates with separable prefixes according to context.
      // sort should prioritize words without padding punctuation
      //    and without semantic annotations.
      (await Promise.all(
        getTokenCombinations(searchStems).map(async parsing => {
          const searchValue = toSortedX(parsing)
          console.log({ searchValue })
          const lex: LexiconMainEntry[] = await table
            .where(SEARCH_STEMS_SORTED)
            .equals(searchValue)
            .limit(50)
            .toArray()
          return lex
        })
      )).flatMap(x => x)
    const matches = [...exactTokensMatches, ...approxMatches]
    if (matches.length)
      results.push({
        index: tokenCharacterIndex,
        translatedTokens: [
          {
            token: exactToken,
            // todo: filter out repeat keys
            candidates: matches.map(m => ({ entry: m, inflections: [] })),
          },
        ],
      })

    console.log(
      { exactToken, indexingCursor, tokenIndex, potentialParsingsAtIndex },
      { tokens: exactTokensMatches }
    )

    indexingCursor = tokenCharacterIndex + exactToken.length - 1
    tokenIndex++
  }

  return results
}

const HEAD: keyof LexiconMainEntry = 'head'
const PRONUNCIATION: keyof LexiconMainEntry = 'pronunciation'

export async function lookUpJapanese(
  text: string
  // activeDictionaries: string[] ???
): Promise<TokenTranslations[]> {
  if (!dexie) return []
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

  return potentialTokens.flatMap(({ tokens, index }) => {
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

      return candidates.length
        ? [
            {
              token,
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
    })

    return translatedTokens.length
      ? [
          {
            index,
            translatedTokens,
          },
        ]
      : []
    // TODO: fix "precise token hit"
    // e.g. in kusukusurawarau, mouseover warau should not give kusukusuwarau but warau.
  })
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
  db: Database,
  allDictionaries: DictionaryFile[],
  key: number,
  type: DictionaryFileType
) {
  console.log('deleting dictionary items!')
  const allDictionariesOfType = allDictionaries.filter(d => d.type === type)
  if (allDictionariesOfType.length <= 1)
    await db.table(getTableName(type)).clear()
  else
    await db
      .table(getTableName(type))
      .where('dictionaryKey')
      .equals(key)
      .delete()

  console.log('deleting dictionary!')

  const tableDeletion = await db.table(DICTIONARIES_TABLE).delete(key)
  console.log('done deleting dictionary!')

  return tableDeletion
}
