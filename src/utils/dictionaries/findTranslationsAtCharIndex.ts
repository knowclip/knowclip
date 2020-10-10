import { TranslatedTokensAtCharacterIndex } from '../dictionariesDatabase'

export function findTranslationsAtCharIndex(
  tokensTranslations: TranslatedTokensAtCharacterIndex[],
  mouseCharacterIndex: number
): TranslatedTokensAtCharacterIndex[] {
  const result: TranslatedTokensAtCharacterIndex[] = []
  for (const tokenTranslations of tokensTranslations) {
    if (mouseCharacterIndex === tokenTranslations.textCharacterIndex) {
      result.push(tokenTranslations)
    } else if (mouseCharacterIndex > tokenTranslations.textCharacterIndex) {
      // if `translatedTokens` are sorted && never empty,
      // only first need be queried.
      const [translatedToken] = tokenTranslations.translatedTokens
      if (
        mouseCharacterIndex <=
        tokenTranslations.textCharacterIndex +
          translatedToken.matchedTokenText.length -
          1
      ) {
        result.push(tokenTranslations)
      }
    }
  }
  return result
}

/** WARNING: array may have empty elements */
export function getCharacterIndexToTranslationsMapping(
  text: string,
  translatedTokensAtIndex: TranslatedTokensAtCharacterIndex[]
): number[][] {
  const result: number[][] = Array(text.length)

  for (
    let tokenTranslationsIndex = translatedTokensAtIndex.length - 1;
    tokenTranslationsIndex >= 0;
    tokenTranslationsIndex--
  ) {
    const translatedToken = translatedTokensAtIndex[tokenTranslationsIndex]
    const { textCharacterIndex, translatedTokens } = translatedToken
    // translatedTokens are meant to be sorted descending by length of their `matchedTokenText`,
    // so we don't need to query each one.
    const [firstTranslatedToken] = translatedTokens
    for (
      let i =
        textCharacterIndex + firstTranslatedToken.matchedTokenText.length - 1;
      i >= textCharacterIndex;
      i--
    ) {
      result[i] = result[i] || []
      result[i].push(tokenTranslationsIndex)
    }
  }
  // let translationsCursor = 0
  // for (let i = 0; i < text.length; i++) {
  //   const char = text[i]

  // }
  return result
}
