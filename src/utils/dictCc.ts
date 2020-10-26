import * as cistem from './cistem'

export const germanSeparablePrefixes = new Set([
  'ab',
  'an',
  'auf',
  'aus',
  'auseinander',
  'bei',
  'da',
  'dabei',
  'dar',
  'daran',
  'dazwischen',
  'durch',
  'ein',
  'empor',
  'entgegen',
  'entlang',
  'entzwei',
  'fehl',
  'fern',
  'fest',
  'fort',
  'frei',
  'gegenüber',
  'gleich',
  'heim',
  'her',
  'herab',
  'heran',
  'herauf',
  'heraus',
  'herbei',
  'herein',
  'herüber',
  'herum',
  'herunter',
  'hervor',
  'hin',
  'hinab',
  'hinauf',
  'hinaus',
  'hinein',
  'hinterher',
  'hinunter',
  'hinweg',
  'hinzu',
  'hoch',
  'kennen',
  'los',
  'mit',
  'nach',
  'nebenher',
  'nieder',
  'statt',
  'um',
  'vor',
  'voran',
  'voraus',
  'vorbei',
  'vorüber',
  'vorweg',
  'weg',
  'weiter',
  'wieder',
  'zu',
  'zurecht',
  'zurück',
  'zusammen',
])

export const fillerWords = new Set([
  'jd.',
  'jds.',
  'jdm.',
  'jdn.',
  'etw.',
  'jd./etw.',
  'jds./etw.',
  'jdm./etw.',
  'jdn./etw.',
])

const trimmedFillerWords = new Set(['jd', 'jds', 'jdn', 'jdm', 'etw'])

export const prefixesRegex = new RegExp(
  `^(${[...germanSeparablePrefixes].join('|')})(zu)?(?=...)`,
  'ui'
)

export const NON_LETTERS_DIGITS_WHITESPACE = /[^\s\p{L}\p{N}]/gu
export const NON_LETTERS_DIGITS_PLUS = /[^\p{L}\p{N}]+/gu
export const LETTERS_DIGITS_PLUS = /[\p{L}\p{N}]+/gu

export function trimNonLettersDigitsOrWhitespace(text: string) {
  return text.replace(NON_LETTERS_DIGITS_WHITESPACE, '')
}

export function getGermanSearchTokens(
  dictCcEntryHead: string,
  lowerCase: boolean = true
) {
  const withoutAnnotations = trimAnnotations(dictCcEntryHead).trim()

  return (lowerCase ? withoutAnnotations.toLowerCase() : withoutAnnotations)
    .split(NON_LETTERS_DIGITS_PLUS)
    .filter((x) => x && !trimmedFillerWords.has(x))
}

export function trimAnnotations(text: string) {
  return text
    .replace(/\{.+?\}/g, '')
    .replace(/\(.+?\)/g, '')
    .replace(/\[.+?\]/g, '')
    .replace(/<.+?>/g, '')
}

export function getGermanDifferingStems(entryHead: string) {
  const stems: string[] = []

  for (const word of getGermanSearchTokens(entryHead)) {
    const stem = getDifferingSearchStem(word) || word

    if (stem) stems.push(stem)
  }

  return stems
}

export function getGermanStems(entryHead: string) {
  const stems: string[] = []

  for (const word of getGermanSearchTokens(entryHead)) {
    const stem = getDifferingSearchStem(word) || word
    stems.push(stem)
  }

  return stems
}

export function getDifferingSearchStem(trimmedWord: string) {
  // really should only do this for -(e)n -(e)t -st...
  let withoutPrefixes = trimmedWord.replace(prefixesRegex, '')

  const stem = cistem.stem(withoutPrefixes)

  return stem === trimmedWord ? undefined : stem
}
