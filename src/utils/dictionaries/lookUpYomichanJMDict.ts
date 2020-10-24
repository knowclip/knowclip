import { getTableName, LexiconEntry } from '../../files/dictionaryFile'
import { lemmatize } from '../yomichanDictionary'
import {
  TextTokensTranslations,
  getDexieDb,
  parseFlat,
  HEAD,
  PRONUNCIATION,
  TranslatedToken,
} from '../dictionariesDatabase'

export async function lookUpYomichanJMDict(
  text: string
  // activeDictionaries: string[] ???
): Promise<TextTokensTranslations> {
  const dexie = getDexieDb()
  const { tokensByIndex: potentialTokens, allTokens } = parseFlat(text)

  const allLookupTokens = Array.from(allTokens, token => [
    token,
    // maybe memoize lemmatize in this function
    ...lemmatize(token).map(t => t.text),
  ]).flat()
  const allQueries: LexiconEntry[] = await dexie
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
                    .length !== 1
                ) {
                  const inflectionsDifference =
                    a.inflections.length - b.inflections.length
                  if (inflectionsDifference) return inflectionsDifference

                  const aScore =
                    typeof a.entry.frequencyScore === 'number'
                      ? a.entry.frequencyScore
                      : Infinity
                  const bScore =
                    typeof b.entry.frequencyScore === 'number'
                      ? b.entry.frequencyScore
                      : Infinity

                  const frequencyDifference = bScore - aScore
                  // if (frequencyDifference)
                  return frequencyDifference
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
    tokensTranslations,
    characterIndexToTranslationsMappings: [],
  }
}
