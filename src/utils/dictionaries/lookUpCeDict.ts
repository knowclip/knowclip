import { getTableName, LexiconEntry } from '../../files/dictionaryFile'
import { lemmatize } from '../yomichanDictionary'
import {
  TextTokensTranslations,
  getDexieDb,
  parseFlat,
  HEAD,
  TranslatedToken,
  sortResult,
  VARIANT,
} from '../dictionariesDatabase'

export async function lookUpCeDict(
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
  const table = await dexie.table(getTableName('CEDictDictionary'))
  const fromText = await table
    .where(HEAD)
    .anyOf(allLookupTokens)
    .distinct()

  const simplifiedFromText = await table
    .where(VARIANT)
    .anyOf(allLookupTokens)
    .distinct()
    .primaryKeys()

  const allQueries = ((await table.bulkGet([
    ...new Set([...(await fromText.primaryKeys()), ...simplifiedFromText]),
  ])) as LexiconEntry[]).sort((a, b) => {
    const aTraditional = a.head
    const bTraditional = b.head
    let differentTraditional = 0
    if (aTraditional < bTraditional) differentTraditional = -1
    if (aTraditional > bTraditional) differentTraditional = 1
    if (differentTraditional) return differentTraditional

    return 0
  })

  console.log(allQueries.length + ' total results!', {
    allQueries,
    allLookupTokens,
  })

  function findTraditional(simplifiedIndex: number, mainKey: number) {
    for (
      let i = simplifiedIndex - 1;
      i > Math.max(-1, simplifiedIndex - 10);
      i--
    ) {
      const potentialMain = allQueries[i]
      if (
        potentialMain &&
        !potentialMain.variant &&
        potentialMain.key === mainKey
      )
        return potentialMain
    }
  }

  // TODO: simplified display
  // tags refinement
  const tokensTranslations = potentialTokens.flatMap(({ tokens, index }) => {
    const translatedTokens = tokens.flatMap(token => {
      const candidates = allQueries.flatMap((entry, i) => {
        if (entry.head === token || entry.variant === token)
          return [
            {
              entry,
              inflections: [] as string[],
            },
          ]

        return []
        // if (entry.head === token && entry.variant) {
        //   const main = findTraditional(i, entry.mainKey)
        //   if (main)
        //     return [
        //       { entry: main, variant: entry, inflections: [] as string[] },
        //     ]
        //   else {
        //     console.error(`Could not find main entry for ${entry.head}`)
        //     return []
        //   }
        // } else if (entry.head === token && !entry.variant) {
        //   const variant = findSimplified(i, entry.key, allQueries.length - 1)
        //   if (
        //     !variant ||
        //     !variant.variant ||
        //     variant.mainKey !== entry.key
        //   ) {
        //     if (variant && variant.variant && variant.mainKey !== entry.key)
        //       console.error(
        //         `Could not find variant entry for token ${entry.head}`
        //       )
        //   }
        //   return [
        //     {
        //       entry,
        //       // variant: undefined, // variant && variant.variant ? variant : undefined,
        //       inflections: [] as string[],
        //     },
        //   ]
        // } else {
        //   return []
        // }
      })

      const translatedTokensAtCharacterIndex: TranslatedToken[] = candidates.length
        ? [
            {
              matchedTokenText: token,
              candidates: candidates.sort((a, b) => {
                const deprioritizeOldVariants = sortResult(
                  !(
                    a.entry.meanings.length &&
                    /variant of/.test(a.entry.meanings.join(''))
                  ),
                  !(
                    b.entry.meanings.length &&
                    /variant of/.test(b.entry.meanings.join(''))
                  )
                )
                if (deprioritizeOldVariants) return deprioritizeOldVariants

                const deprioritizeProperNouns = sortResult(
                  !(
                    a.entry.pronunciation && /[A-Z]/.test(a.entry.pronunciation)
                  ),
                  !(
                    b.entry.pronunciation && /[A-Z]/.test(b.entry.pronunciation)
                  )
                )
                if (deprioritizeProperNouns) return deprioritizeProperNouns

                return 0
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
  })

  console.log({ tokensTranslations })
  return {
    tokensTranslations,
    characterIndexToTranslationsMappings: [],
  }
}
