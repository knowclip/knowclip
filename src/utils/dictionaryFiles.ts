import Dexie, { Database } from 'dexie'
import { basename } from 'path'
import { getTableName, LexiconMainEntry } from '../files/dictionaryFile'
import { uuid } from './sideEffects'
import yomichanLemmatization from './yomichanLemmatization.json'

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
    DictCCDictionary: '++key, head, pronunciation, dictionaryKey',
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
  tokens: {
    token: string
    candidates: LexiconMainEntry[]
  }[]
}

export async function lookUpJapanese(
  text: string
): Promise<TokenTranslations[]> {
  if (!dexie) return []
  const potentialTokens = parseFlat(text)

  return await Promise.all(
    potentialTokens.map(async ({ tokens, index }) => {
      const tokenQueries = await Promise.all(
        tokens.map(async token => {
          const potentialBases = lemmatize(token)
          const differingBases =
            potentialBases.length > 1 || potentialBases[0] !== token
          const lookupTokens = differingBases
            ? [token, ...potentialBases]
            : [token]
          const query: LexiconMainEntry[] = await dexie
            .table(getTableName('YomichanDictionary'))
            .where('head')
            .anyOfIgnoreCase(lookupTokens)
            .or('pronunciation')
            .anyOfIgnoreCase(lookupTokens)
            .toArray()

          const candidates = query.sort((a, b) => {
            if (a.head === token || a.pronunciation == token) return 1

            const aScore =
              typeof a.frequencyScore === 'number' ? a.frequencyScore : -9999
            const bScore =
              typeof b.frequencyScore === 'number' ? b.frequencyScore : -9999
            return bScore - aScore
          })

          return {
            token,
            candidates,
          }
        })
      )

      return {
        index,
        tokens: tokenQueries
          .filter(({ candidates }) => candidates.length)
          .sort((a, b) => b.token.length - a.token.length),
      }
    })
  )
}

function wordIndexes(s: string) {
  const rx = /([^\uFF0C\uFE10\uFE50\u1F101-\u1F10A\u0000-\u007F\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F\u3200-\u32FF\u3300-\u33FF\uFE30-\uFE4F\u12400-\u1247F\u16FE0-\u16FFF \w\s]+)[\uFF0C\uFE10\uFE50\u1F101-\u1F10A\u0000-\u007F\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F\u3200-\u32FF\u3300-\u33FF\uFE30-\uFE4F\u12400-\u1247F\u16FE0-\u16FFF \w\s]*/gu
  const match = [...s.matchAll(rx)]
  return match.map((v, i) => ({ string: v[1] as string, index: i }))
}

type CJTextTokens = { index: number; tokens: string[] }[]
export function parseFlat(data: string, maxWordLength = 8) {
  let tokens: CJTextTokens = []
  if (!data) return tokens

  const sentences = wordIndexes(data)
  for (let { index: startIndex, string: sentence } of sentences.filter(
    ({ index, string }) => string.length
  )) {
    for (let start = 0; start < sentence.length; ++start) {
      const tokensAtIndex: string[] = []
      tokens.push({ index: startIndex + start, tokens: tokensAtIndex })
      let maxCurrLength = sentence.length - start
      for (
        let amount =
          maxWordLength <= maxCurrLength ? maxWordLength : maxCurrLength;
        amount > 0;
        --amount
      ) {
        const token = sentence.substr(start, amount)
        tokensAtIndex.push(token)
      }
    }
  }
  return tokens
}

const yomichanLemmatizationEntries = Object.entries(yomichanLemmatization)
function lemmatize(text: string) {
  const candidates: string[] = []
  for (const [
    formName,
    { kanaIn, kanaOut },
  ] of yomichanLemmatizationEntries as any) {
    if (text.endsWith(kanaIn))
      candidates.push(text.replace(new RegExp(`${kanaIn}$`), kanaOut))
  }
  return candidates
}

export async function deleteDictionary(
  db: Database,
  allDictionaries: DictionaryFile[],
  key: number,
  type: DictionaryFileType
) {
  const allDictionariesOfType = allDictionaries.filter(d => d.type === type)
  if (allDictionariesOfType.length <= 1)
    await db.table(getTableName(type)).clear()
  else
    await db
      .table(getTableName(type))
      .where('dictionaryKey')
      .equals(key)
      .delete()

  return await db.table(DICTIONARIES_TABLE).delete(key)
}
