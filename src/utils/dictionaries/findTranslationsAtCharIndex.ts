import { TranslatedTokensAtCharacterIndex } from '../dictionariesDatabase'

export function findTranslationsAtCharIndex(
  tokensTranslations: TranslatedTokensAtCharacterIndex[],
  mouseCharacterIndex: number
): TranslatedTokensAtCharacterIndex | null {
  const overlaps: TranslatedTokensAtCharacterIndex[] = []
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
