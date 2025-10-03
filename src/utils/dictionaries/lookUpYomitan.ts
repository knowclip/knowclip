import {
  getDexieDb,
  TranslatedToken,
  YOMITAN_DICTIONARY_TERMS_TABLE,
  YOMITAN_DICTIONARY_MEDIA_TABLE,
  YOMITAN_DICTIONARY_TAGS_TABLE,
  DICTIONARIES_TABLE,
} from '../dictionariesDatabase'
import {
  DatabaseTermEntryWithId,
  Tag,
} from '../../vendor/yomitan/types/ext/dictionary-database'
import { YomitanMediaRecord } from './importYomitanEntries'
import {
  TermGlossary,
  TermGlossaryDeinflection,
  TermGlossaryStructuredContent,
} from '../../vendor/yomitan/types/ext/dictionary-data'
import { Element } from '../../vendor/yomitan/types/ext/structured-content'
import { getImageMediaTypeFromFileName } from '../../vendor/yomitan/ext/js/media/media-util'
import { LanguageTransformer } from '../../vendor/yomitan/ext/js/language/language-transformer'
import { japaneseTransforms } from '../../vendor/yomitan/ext/js/language/ja/japanese-transforms'
import { LanguageTransformDescriptor } from '../../vendor/yomitan/types/ext/language-transformer'
import { TransformedText } from '../../vendor/yomitan/types/ext/language-transformer-internal'
import optionsSchema from '../../vendor/yomitan/ext/data/schemas/options-schema.json'
import { germanTransforms } from '../../vendor/yomitan/ext/js/language/de/german-transforms'
import Dexie, { Collection } from 'dexie'

const SCANNING_EXTENT = 50
const MAXIMUM_RESULTS_COUNT = 32

const hardPhraseBoundaryPunctuation = new Set(
  optionsSchema.properties.profiles.items.properties.options.properties.sentenceParsing.properties.terminationCharacters.default.flatMap(
    (c) => [c.character1, ...(c.character2 ? [c.character2] : [])]
  )
)

const transormersCache = new Map<
  LanguageTransformDescriptor,
  LanguageTransformer
>()
function getTransformer<TCondition extends string>(
  transforms: LanguageTransformDescriptor<TCondition>
) {
  let transformer = transormersCache.get(transforms)
  if (!transformer) {
    transformer = new LanguageTransformer()
    transformer.addDescriptor(transforms)
    transormersCache.set(transforms, transformer)
  }
  return transformer
}
function lemmatize<TCondition extends string>(
  text: string,
  transforms: LanguageTransformDescriptor<TCondition>
): TransformedText[] {
  return getTransformer(transforms).transform(text)
}

/** Narrowing down of parts of speech currently only implemented in German-style */
const getTranslationPartOfSpeech = (
  translation: DatabaseTermEntryWithId
): 'VERB' | 'NONVERB' => {
  const definitionTags = translation.definitionTags?.split(' ') || []
  const termTags = translation.termTags?.split(' ') || []
  if (!definitionTags.includes('non-lemma')) {
    return definitionTags.includes('v') || termTags.includes('v')
      ? 'VERB'
      : 'NONVERB'
  }

  if (
    Array.isArray(translation.glossary) &&
    Array.isArray(translation.glossary[0]) &&
    translation.glossary.some(
      (entry) =>
        Array.isArray(entry) &&
        Array.isArray(entry[1]) &&
        entry[1].some(
          (string: any) =>
            string === 'first-person' ||
            string === 'second-person' ||
            string === 'third-person'
        )
    )
  ) {
    return 'VERB'
  } else {
    return 'NONVERB'
  }
}

export async function lookUpYomitan(
  activeDictionariesIds: Set<string>,
  text: string,
  deinflect = true
) {
  const dexie = getDexieDb()
  console.log(`${!deinflect ? 'NOT ' : ''}deinflecting`, text)

  // split text at "hard phrase boundaries" (e.g. sentence punctuation)
  // within each chunk, find all unique search tokens by:
  // - collecting all substrings of length less than or equal to SCANNING_EXTENT
  // - collecting any lemmatized forms of each of those substrings.

  const { allLookupTokens, tokensToLemmatizations, tokensPositions } =
    tokenizeText(text, deinflect, true)

  console.log('looking up using tokens', allLookupTokens)
  const translationsLookupResults = await lookUpTranslations(
    dexie,
    allLookupTokens,
    activeDictionariesIds
  )
  console.log(
    `Got ${await translationsLookupResults.length} results`,
    translationsLookupResults
  )
  const translations: DatabaseTermEntryWithId[] = []
  /** tokens to parts of speech of their lemmas */
  const furtherLookupTokens = new Map<string, Set<'VERB' | 'NONVERB'>>()
  await translationsLookupResults.forEach((translation) => {
    if (translation.definitionTags === 'non-lemma') {
      for (const glossaryItem of translation.glossary as TermGlossaryDeinflection[]) {
        const [lemma, _inflections] = glossaryItem
        if (!allLookupTokens.has(lemma)) {
          const expressionLemmatizations =
            tokensToLemmatizations.get(translation.expression) || []
          expressionLemmatizations.push(glossaryItem)
          tokensToLemmatizations.set(
            translation.expression,
            expressionLemmatizations
          )
          const partsOfSpeechForLemma =
            furtherLookupTokens.get(lemma) || new Set()
          const partOfSpeech = getTranslationPartOfSpeech(translation)
          partsOfSpeechForLemma.add(partOfSpeech)
          furtherLookupTokens.set(lemma, partsOfSpeechForLemma)
          if (translation.expression !== translation.reading) {
            const readingLemmatizations =
              tokensToLemmatizations.get(translation.reading) || []
            readingLemmatizations.push(glossaryItem)
            tokensToLemmatizations.set(
              translation.reading,
              readingLemmatizations
            )
          }
        }
      }
    } else {
      translations.push(translation)
    }
  })
  console.log('further lookup tokens', furtherLookupTokens)

  if (deinflect) {
    const furtherTranslationsLookups = await lookUpTranslations(
      dexie,
      furtherLookupTokens.keys(),
      activeDictionariesIds
    )
    console.log(
      `Got ${await furtherTranslationsLookups.length} further results`,
      furtherTranslationsLookups,
      'from',
      furtherLookupTokens
    )
    await furtherTranslationsLookups.forEach((translation) => {
      const { expression } = translation
      const furtherLookupPartOfSpeech = getTranslationPartOfSpeech(translation)
      console.log(
        'expression',
        expression,
        'has pos',
        furtherLookupPartOfSpeech
      )
      const partsOfSpeechForLemma = furtherLookupTokens.get(expression)
      if (
        partsOfSpeechForLemma &&
        partsOfSpeechForLemma.has(furtherLookupPartOfSpeech)
      )
        translations.push(translation)
    })
  }
  const {
    hasTranslations,
    getTranslations,
    tokensToTranslationsWithMatchingExpression,
    tokensToTranslationsWithMatchingReading,
  } = getTranslationLookupTables(translations, tokensToLemmatizations)

  const translatedTokensByIndex = new Map<number, string[]>()
  for (const [token, positions] of tokensPositions) {
    if (hasTranslations(token))
      for (const position of positions) {
        const translatedTokens = translatedTokensByIndex.get(position) || []
        translatedTokensByIndex.set(position, translatedTokens)
        translatedTokens.push(token)
      }
  }
  for (const tokens of translatedTokensByIndex.values()) {
    tokens.sort((a, b) => b.length - a.length) // descending
  }
  const getTranslatedTokensAtCharacterIndex = (
    index: number
  ): TranslatedToken<DatabaseTermEntryWithId, TransformedText>[] =>
    (translatedTokensByIndex.get(index) || []).map(
      (token): TranslatedToken<DatabaseTermEntryWithId, TransformedText> => {
        const tokenTranslations = getTranslations(token)
        return {
          matchedTokenText: token,
          matches: [
            ...(tokenTranslations?.expression || []).map((entry) => ({
              entry,
            })),
            ...(tokenTranslations?.reading || []).map((entry) => ({
              entry,
            })),
            ...(tokenTranslations?.inflectedExpression || []).flatMap(
              (lemmatization) =>
                tokensToTranslationsWithMatchingExpression
                  .get(getLemma(lemmatization))!
                  .map((entry) => ({
                    entry,
                    inflection: lemmatization,
                  }))
            ),
            ...(tokenTranslations?.inflectedReading || []).flatMap(
              (lemmatization) =>
                tokensToTranslationsWithMatchingReading
                  .get(getLemma(lemmatization))!
                  .map((entry) => ({
                    entry,
                    inflection: lemmatization,
                  }))
            ),
          ].sort((a, b) => b.entry.score - a.entry.score),
        }
      }
    )

  const tagNames = new Set<string>()
  for (const translation of translations) {
    if (translation.termTags)
      translation.termTags.split(' ').forEach((tag) => tagNames.add(tag))
    if (translation.definitionTags)
      translation.definitionTags.split(' ').forEach((tag) => tagNames.add(tag))
  }
  const tags: Tag[] = await dexie
    .table(YOMITAN_DICTIONARY_TAGS_TABLE)
    .where('name' satisfies keyof Tag)
    .anyOf([...tagNames])
    .and((t) => activeDictionariesIds.has(t.dictionary))
    .toArray()
  // console.log(
  //   'allLookupTokens',
  //   allLookupTokens,
  //   'tokensPositions',
  //   tokensPositions,
  //   'tokensToLemmatizations',
  //   tokensToLemmatizations
  // )

  const media: Record<string, { record: YomitanMediaRecord; url: ObjectURL }> =
    {}
  for (const translation of translations) {
    // get media for glossary.type === 'image' or 'structured content'
    for (const glossaryItem of translation.glossary) {
      if (typeof glossaryItem === 'object' && 'type' in glossaryItem) {
        if (glossaryItem.type === 'structured-content') {
          await traverseStructuredContent(
            glossaryItem.content,
            async (node) => {
              if (node.tag === 'img') {
                const path = node.path
                if (!path || media[path]) return
                const mediaRecord: YomitanMediaRecord = await dexie
                  .table(YOMITAN_DICTIONARY_MEDIA_TABLE)
                  .where('path')
                  .equals(path)
                  .and((m) => activeDictionariesIds.has(m.dictionary))
                  .first()
                if (mediaRecord)
                  media[path] = {
                    record: mediaRecord,
                    url: getObjectUrlFromMediaRecord(mediaRecord),
                  }
              }
            }
          )
        }
      }
    }
  }
  return {
    getTranslatedTokensAtCharacterIndex,
    tags: Object.fromEntries(tags.map((tag) => [tag.name, tag])),
    media,
  }
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}
function isCapitalized(text: string) {
  return text.charAt(0).toUpperCase() === text.charAt(0)
}

function tokenizeText(text: string, deinflect: boolean, useSpaces: boolean) {
  const tokensPositions = new Map<string, number[]>()
  const tokensToLemmatizations = new Map<
    string,
    (TransformedText | TermGlossaryDeinflection)[]
  >()

  if (useSpaces) {
    const tokenBoundaryRegex = new RegExp(
      `[^${[...hardPhraseBoundaryPunctuation].join('')}\\s,]+`,
      'g'
    )
    const chunks = text.matchAll(tokenBoundaryRegex)
    for (const chunk of chunks) {
      const chunkText = chunk[0]
      const chunkStartIndex = chunk.index
      const tokenAppearances = tokensPositions.get(chunkText) || []
      tokenAppearances.push(chunkStartIndex)
      tokensPositions.set(chunkText, tokenAppearances)
      const lowercaseToken = isCapitalized(chunkText)
        ? chunkText.toLowerCase()
        : null
      if (lowercaseToken) {
        const lowercaseTokenAppearances =
          tokensPositions.get(lowercaseToken) || []
        lowercaseTokenAppearances.push(chunkStartIndex)
        tokensPositions.set(lowercaseToken, lowercaseTokenAppearances)
      }

      if (deinflect) {
        tokensToLemmatizations.set(
          chunkText,
          tokensToLemmatizations.get(chunkText) ||
            lemmatize(chunkText, germanTransforms)
          // lemmatize(chunkText, japaneseTransforms)
        )

        if (lowercaseToken) {
          tokensToLemmatizations.set(
            lowercaseToken,
            tokensToLemmatizations.get(lowercaseToken) ||
              lemmatize(lowercaseToken, germanTransforms)
            // lemmatize(lowercaseToken, japaneseTransforms)
          )
        }
      }
    }
    const allLookupTokens = new Set([
      ...tokensPositions.keys(),
      ...Array.from(tokensToLemmatizations, ([, lemmatizations]) =>
        lemmatizations.map((lemmatization) => {
          // at this point, these are guaranteed to be only `TransformedText`
          return getLemma(lemmatization as TransformedText)
        })
      ).flat(),
    ])
    console.log(allLookupTokens)
    return { allLookupTokens, tokensToLemmatizations, tokensPositions }
  } else {
    const hardPhraseBoundaryRegex = new RegExp(
      `[^${[...hardPhraseBoundaryPunctuation].join('')}]+`,
      'g'
    )
    const chunks = text.matchAll(hardPhraseBoundaryRegex)
    for (const chunk of chunks) {
      const chunkText = chunk[0]
      const chunkStartIndex = chunk.index
      for (
        let tokenFirstIndex = 0;
        tokenFirstIndex < chunkText.length;
        tokenFirstIndex++
      ) {
        for (
          let tokenLastIndex = 0;
          tokenLastIndex < chunkText.length &&
          tokenLastIndex - tokenFirstIndex < SCANNING_EXTENT;
          tokenLastIndex++
        ) {
          const token = chunkText.slice(tokenFirstIndex, tokenLastIndex + 1)
          const tokenAppearances = tokensPositions.get(token) || []
          tokenAppearances.push(chunkStartIndex + tokenFirstIndex)
          tokensPositions.set(token, tokenAppearances)
          if (deinflect)
            tokensToLemmatizations.set(
              token,
              tokensToLemmatizations.get(token) ||
                lemmatize(token, germanTransforms)
              // lemmatize(token, japaneseTransforms)
            )
        }
      }
    }
    const allLookupTokens = new Set([
      ...tokensPositions.keys(),
      ...Array.from(tokensToLemmatizations, ([, lemmatizations]) =>
        lemmatizations.map((lemmatization) => {
          // at this point, these are guaranteed to be only `TransformedText`
          return getLemma(lemmatization as TransformedText)
        })
      ).flat(),
    ])
    return { allLookupTokens, tokensToLemmatizations, tokensPositions }
  }
}

async function lookUpTranslations(
  dexie: Dexie,
  allLookupTokens: Iterable<string>,
  activeDictionariesIds: Set<string>
) {
  const lookupTokensArray = [...allLookupTokens]
  return await dexie
    .table(YOMITAN_DICTIONARY_TERMS_TABLE)
    .where('expression' satisfies keyof DatabaseTermEntryWithId)
    .anyOf(lookupTokensArray)
    .or('reading' satisfies keyof DatabaseTermEntryWithId)
    .anyOf(lookupTokensArray)
    .and((t: DatabaseTermEntryWithId) =>
      activeDictionariesIds.has(t.dictionary)
    )
    .distinct()
    .toArray()
}

function getLemma(lemmatization: TransformedText | TermGlossaryDeinflection) {
  return 'trace' in lemmatization ? lemmatization.text : lemmatization[0]
}

function getTranslationLookupTables(
  translations: DatabaseTermEntryWithId[],
  tokensToLemmatizations: Map<
    string,
    (TransformedText | TermGlossaryDeinflection)[]
  >
) {
  type TranslatedTokenText = string
  /** for looking up e.g. "読む" → 読む */
  const tokensToTranslationsWithMatchingExpression = new Map<
    TranslatedTokenText,
    DatabaseTermEntryWithId[]
  >()
  /** for looking up e.g. "よむ" → 読む */
  const tokensToTranslationsWithMatchingReading = new Map<
    TranslatedTokenText,
    DatabaseTermEntryWithId[]
  >()
  for (const translation of translations) {
    const expressionTerms =
      tokensToTranslationsWithMatchingExpression.get(translation.expression) ||
      []
    tokensToTranslationsWithMatchingExpression.set(
      translation.expression,
      expressionTerms
    )
    expressionTerms.push(translation)
    if (translation.expression !== translation.reading) {
      // check if this should use translation.expression
      const readingTerms =
        tokensToTranslationsWithMatchingReading.get(translation.reading) || []
      tokensToTranslationsWithMatchingReading.set(
        translation.reading,
        readingTerms
      )
      readingTerms.push(translation)
    }
  }
  /** for looking up e.g. "読んだ" → 読む */
  const tokensToTranslationsViaExpressionLemmatizations = new Map<
    TranslatedTokenText,
    (TransformedText | TermGlossaryDeinflection)[]
  >()
  /** for looking up e.g. "よんだ" → 読む */
  const tokensToTranslationsViaReadingLemmatizations = new Map<
    TranslatedTokenText,
    (TransformedText | TermGlossaryDeinflection)[]
  >()
  for (const [token, lemmatizations] of tokensToLemmatizations) {
    for (const lemmatization of lemmatizations) {
      if (
        'trace' in lemmatization
          ? lemmatization.trace.length
          : lemmatization[1].length
      ) {
        const lemma =
          'trace' in lemmatization ? lemmatization.text : lemmatization[0]
        const expressionMatches =
          tokensToTranslationsWithMatchingExpression.get(lemma)
        if (expressionMatches) {
          const arr =
            tokensToTranslationsViaExpressionLemmatizations.get(token) || []
          tokensToTranslationsViaExpressionLemmatizations.set(token, arr)
          arr.push(lemmatization)
        }

        const readingMatches =
          tokensToTranslationsWithMatchingReading.get(lemma)
        if (readingMatches) {
          const arr =
            tokensToTranslationsViaReadingLemmatizations.get(token) || []
          tokensToTranslationsViaReadingLemmatizations.set(token, arr)
          arr.push(lemmatization)
        }
      }
    }
  }

  const hasTranslations = (token: string) =>
    tokensToTranslationsWithMatchingExpression.has(token) ||
    tokensToTranslationsWithMatchingReading.has(token) ||
    tokensToTranslationsViaExpressionLemmatizations.has(token) ||
    tokensToTranslationsViaReadingLemmatizations.has(token)
  const getTranslations = (token: string) => {
    const result = {
      expression: tokensToTranslationsWithMatchingExpression.get(token),
      reading: tokensToTranslationsWithMatchingReading.get(token),
      inflectedExpression:
        tokensToTranslationsViaExpressionLemmatizations.get(token),
      inflectedReading: tokensToTranslationsViaReadingLemmatizations.get(token),
    }
    if (
      result.expression ||
      result.reading ||
      result.inflectedExpression?.length ||
      result.inflectedReading?.length
    ) {
      return result
    }
    return null
  }
  return {
    hasTranslations,
    getTranslations,
    tokensToTranslationsWithMatchingExpression,
    tokensToTranslationsWithMatchingReading,
  }
}

function getObjectUrlFromMediaRecord(
  mediaRecord: YomitanMediaRecord
): ObjectURL {
  return URL.createObjectURL(
    new Blob([mediaRecord.content], {
      type: getImageMediaTypeFromFileName(mediaRecord.path)!,
    })
  )
}

async function traverseStructuredContent(
  content: TermGlossaryStructuredContent['content'],
  callback: (node: Element) => Promise<void>
) {
  if (Array.isArray(content)) {
    for (const node of content) {
      await traverseStructuredContent(node, callback)
    }
  } else if (typeof content === 'object' && content.content) {
    await traverseStructuredContent(content.content, callback)
  } else if (typeof content === 'object') {
    await callback(content)
  }
}

type ObjectURL = string
