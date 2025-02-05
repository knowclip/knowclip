import type { LexiconEntry, TranslatedToken } from '../dictionariesDatabase'

/** The translations for terms found at a given index within the lookup text. */
export type TranslatedTokensAtCharacterIndex<
  EntryType extends LexiconEntry = LexiconEntry,
  InflectionType = unknown,
> = {
  /** Corresponds to the given index *only when a translation was found for a token starting right at the given index*.
   * In case there are no translations for tokens starting at the given index, *but there are translations for tokens overlapping the given index*,
   * this value will be the start of the longest overlapping token.
   */
  textCharacterIndex: number
  /** To be sorted by length of matchedTokenText */
  translatedTokens: TranslatedToken<EntryType, InflectionType>[]
}

export function findTranslationsAtCharIndex<
  EntryType extends LexiconEntry,
  InflectionType,
>(
  tokensTranslations: TranslatedTokensAtCharacterIndex<
    EntryType,
    InflectionType
  >[],
  mouseCharacterIndex: number
) {
  const overlaps: TranslatedTokensAtCharacterIndex<
    EntryType,
    InflectionType
  >[] = []
  for (const tokenTranslations of tokensTranslations) {
    if (mouseCharacterIndex === tokenTranslations.textCharacterIndex) {
      overlaps.push(tokenTranslations)
    } else if (mouseCharacterIndex > tokenTranslations.textCharacterIndex) {
      const [translatedToken] = tokenTranslations.translatedTokens
      if (
        mouseCharacterIndex <=
        tokenTranslations.textCharacterIndex +
          translatedToken.matchedTokenText.length -
          1
      ) {
        overlaps.push(tokenTranslations)
      }
    }
  }
  return overlaps.length ? overlaps[overlaps.length - 1] : null
}
