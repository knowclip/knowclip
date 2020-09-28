import Dexie from 'dexie'
import { LexiconMainEntry } from '../files/dictionaryFile'
import yomichanLemmatization from './yomichanLemmatization.json'

const LATEST_DEXIE_DB_VERSION = 1

const YOMICHAN_DB_NAME = 'YomichanJMDict'
const CEDICT_DB_NAME = 'CEDict'
const DICT_CC_NAME = 'DictCC'

let db: Dexie

export function getDexieDb() {
  db = new Dexie('DictionaryEntries')

  db.version(LATEST_DEXIE_DB_VERSION).stores({
    entries: '++id, head, pronunciation, dictionaryId',
  })

  return db
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
  if (!db) return []
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
          const query: LexiconMainEntry[] = await db
            .table('entries')
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
