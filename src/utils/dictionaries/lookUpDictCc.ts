import { getTableName, LexiconEntry } from '../../files/dictionaryFile'
import {
  germanSeparablePrefixes,
  getDifferingSearchStem,
  getGermanSearchTokens,
  NON_LETTERS_DIGITS_PLUS,
  prefixesRegex,
  trimAnnotations,
} from '../dictCc'
import { getTokenCombinations } from '../tokenCombinations'
import {
  TextTokensTranslations,
  getDexieDb,
  TOKEN_COMBOS,
  TranslatedTokensAtCharacterIndex,
  sortResult,
} from '../dictionariesDatabase'

export const MAX_GERMAN_SEARCH_TOKENS_COUNT = 5

export async function lookUpDictCc(
  text: string,
  maxQueryTokensLength: number = 5
): Promise<TextTokensTranslations> {
  const dexie = getDexieDb()

  const textTokens = getGermanSearchTokensFromText(text)
  const textPrefixes = new Set(
    textTokens.filter(t => germanSeparablePrefixes.has(t.toLowerCase()))
  )
  const textStems = getGermanTextSearchStems(
    textTokens.map(x => x.toLowerCase())
  )

  const table = dexie.table(getTableName('DictCCDictionary'))

  const allSearchStemsStrings = textStems.flatMap((stem, tokenIndex) => {
    const searchStems = textStems.slice(
      tokenIndex,
      tokenIndex + maxQueryTokensLength
    )
    const combos = getGermanTextSearchTokensCombos(searchStems)
    return combos
  })

  const { exactStemsMatches } = await dexie.transaction(
    'r',
    table,
    async () => {
      const exactStemsMatches = table
        .where(TOKEN_COMBOS)
        .anyOf(allSearchStemsStrings)
        .distinct()
        .toArray()
      return {
        exactStemsMatches: (await exactStemsMatches) as LexiconEntry[],
      }
    }
  )

  const results: TranslatedTokensAtCharacterIndex[] = []

  let indexingCursor = 0
  let tokenIndex = 0
  for (const exactToken of textTokens) {
    const searchStems = textStems.slice(
      tokenIndex,
      tokenIndex + maxQueryTokensLength
    )
    const stemCombinationsAtIndex = getTokenCombinations(searchStems)

    const tokenCharacterIndex = text
      .toLowerCase()
      .indexOf(exactToken.toLowerCase(), indexingCursor)
    const searchStemsAtIndex = stemCombinationsAtIndex.flatMap(stemCombo => {
      const stemComboString = stemCombo.sort().join(' ')
      // perhaps can use entry.tokenCombos first value instead of calling getGermanSearchTokens each time here?
      // except here we're testing "raw" tokens, not stems
      const exactMatches = exactStemsMatches.filter(entry => {
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
        translatedTokens: [
          {
            matchedTokenText: exactToken,
            candidates: searchStemsAtIndex.map(entry => ({
              entry,
              inflections: [],
              variant: undefined,
            })),
          },
        ],
      })

    indexingCursor = tokenCharacterIndex + exactToken.length - 1
    tokenIndex++
  }
  // should sort to prioritize
  // exact matches and matches
  // preserving the order parts corresponding to query tokens
  for (const result of results) {
    const { matchedTokenText } = result.translatedTokens[0]
    const lowercaseMatchedTokenText = matchedTokenText.toLowerCase()
    result.translatedTokens[0].candidates.sort((a, b) => {
      const deprioritizeFictionTitles = sortResult(
        !(a.entry.tags && a.entry.tags.includes('[F]')),
        !(b.entry.tags && b.entry.tags.includes('[F]'))
      )
      if (deprioritizeFictionTitles) return deprioritizeFictionTitles

      const sortByExactMatch = sortResult(
        a.entry.head === matchedTokenText,
        b.entry.head === matchedTokenText
      )
      if (sortByExactMatch) return sortByExactMatch

      const sortByExactMatchWithoutAnnotations = sortResult(
        getGermanSearchTokens(a.entry.head, false).join(' ') ===
          matchedTokenText,
        getGermanSearchTokens(b.entry.head, false).join(' ') ===
          matchedTokenText
      )
      if (sortByExactMatchWithoutAnnotations)
        return sortByExactMatchWithoutAnnotations

      const sortByCaseInsensitiveTextMatch = sortResult(
        a.entry.head.toLowerCase() === lowercaseMatchedTokenText,
        b.entry.head.toLowerCase() === lowercaseMatchedTokenText
      )
      if (sortByCaseInsensitiveTextMatch) return sortByCaseInsensitiveTextMatch

      const aSearchTokensLowercase = getGermanSearchTokens(a.entry.head, true)
      const bSearchTokensLowercase = getGermanSearchTokens(b.entry.head, true)
      const matchedTokenTrimmed = trimAnnotations(lowercaseMatchedTokenText)
      const sortByCaseInsensitiveExactMatchWithoutAnnotations = sortResult(
        aSearchTokensLowercase.join(' ') === matchedTokenTrimmed,
        bSearchTokensLowercase.join(' ') === matchedTokenTrimmed
      )

      if (sortByCaseInsensitiveExactMatchWithoutAnnotations)
        return sortByCaseInsensitiveExactMatchWithoutAnnotations

      const aSearchStemsLowercase = getGermanTextSearchStems(
        aSearchTokensLowercase
      )
      const bSearchStemsLowercase = getGermanTextSearchStems(
        bSearchTokensLowercase
      )

      const textTokens = getGermanTextSearchStems(
        getGermanSearchTokensFromText(lowercaseMatchedTokenText)
      ).join(' ')
      const sortByCaseInsensitiveStemMatchWithoutAnnotations = sortResult(
        aSearchTokensLowercase.length === 1 &&
          aSearchStemsLowercase.join(' ') === textTokens,
        bSearchStemsLowercase.length === 1 &&
          bSearchStemsLowercase.join(' ') === textTokens
      )
      if (sortByCaseInsensitiveStemMatchWithoutAnnotations)
        return sortByCaseInsensitiveStemMatchWithoutAnnotations

      const [, aMatchPrefix] =
        lowercaseMatchedTokenText.match(prefixesRegex) || []

      const [aCandidatePrefix] = aSearchTokensLowercase.flatMap(
        candidateToken => {
          const candidateTokenStem =
            getDifferingSearchStem(candidateToken) || candidateToken
          if (
            candidateTokenStem !==
            (getDifferingSearchStem(matchedTokenText) || matchedTokenText)
          )
            return []

          const [, prefix] = candidateToken.match(prefixesRegex) || []
          return prefix ? [prefix] : []
        }
      )

      const [, bMatchPrefix] =
        lowercaseMatchedTokenText.match(prefixesRegex) || []
      const [bCandidatePrefix] = bSearchTokensLowercase.flatMap(
        candidateToken => {
          const candidateTokenStem =
            getDifferingSearchStem(candidateToken) || candidateToken
          if (
            candidateTokenStem !==
            (getDifferingSearchStem(matchedTokenText) || matchedTokenText)
          )
            return []

          const [, prefix] = candidateToken.match(prefixesRegex) || []
          return prefix ? [prefix] : []
        }
      )

      // nico 05:41 geht das?
      //      22:02 mitkommen
      //      1:25:56   lueg mich nicht an
      //      1:33:32 kleinen
      const aPrefixRelevanceScore = aMatchPrefix
        ? aCandidatePrefix
          ? aMatchPrefix === aCandidatePrefix
            ? 3
            : 0
          : 2
        : aCandidatePrefix
        ? textPrefixes.has(aCandidatePrefix)
          ? 3
          : 0
        : 2
      const bPrefixRelevanceScore = bMatchPrefix
        ? bCandidatePrefix
          ? bMatchPrefix === bCandidatePrefix
            ? 3
            : 0
          : 2
        : bCandidatePrefix
        ? textPrefixes.has(bCandidatePrefix)
          ? 3
          : 0
        : 2

      const prefixRelevance = bPrefixRelevanceScore - aPrefixRelevanceScore
      if (prefixRelevance) return prefixRelevance

      const prioritizeNoTermTags = sortResult(
        !(a.entry.tags && /[[\]]/.test(a.entry.tags)),
        !(b.entry.tags && /[[\]]/.test(b.entry.tags))
      )
      if (prioritizeNoTermTags) return prioritizeNoTermTags

      const prioritizeNoParens = sortResult(
        !/[()]/.test(a.entry.head),
        !/[()]/.test(b.entry.head)
      )
      if (prioritizeNoParens) return prioritizeNoParens

      const prioritizePronounsAndConjunctions = sortResult(
        Boolean(a.entry.tags && /(conj|pron)/.test(a.entry.tags)),
        Boolean(b.entry.tags && /(conj|pron)/.test(b.entry.tags))
      )
      if (prioritizePronounsAndConjunctions)
        return prioritizePronounsAndConjunctions

      const prioritizeWithoutDash = sortResult(
        !/(- |-$)/.test(a.entry.head),
        !/(- |-$)/.test(b.entry.head)
      )
      if (prioritizeWithoutDash) return prioritizeWithoutDash

      const aHeadLowerCase = trimAnnotations(a.entry.head.toLowerCase())
      const bHeadLowerCase = trimAnnotations(b.entry.head.toLowerCase())
      if (aHeadLowerCase < bHeadLowerCase) return -1
      if (aHeadLowerCase > bHeadLowerCase) return 1

      return 0
    })
  }

  return {
    tokensTranslations: results,
    characterIndexToTranslationsMappings: [],
  }
}

export function getGermanSearchTokensFromText(
  germanText: string,
  lowerCase: boolean = false
) {
  const withoutAnnotations = germanText.trim()
  const tokens = (lowerCase
    ? withoutAnnotations.toLowerCase()
    : withoutAnnotations
  )
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

function getTokenComboWithLengthString(tokenCombo: string[], length: number) {
  return [...tokenCombo.sort(), length.toString(16).padStart(2, '0')].join(' ')
}

function getGermanTextSearchStems(lowercaseTokens: string[]) {
  const stems: string[] = []

  for (const word of lowercaseTokens) {
    const stem = getDifferingSearchStem(word) || word
    stems.push(stem)
  }

  return stems
}
