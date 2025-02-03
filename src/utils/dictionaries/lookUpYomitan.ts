import { lemmatize } from '../yomichanDictionary'
import {
  TextTokensTranslations,
  getDexieDb,
  parseFlat,
  TranslatedToken,
  YOMITAN_DICTIONARY_TERMS_TABLE,
  YOMITAN_DICTIONARY_MEDIA_TABLE,
  YOMITAN_DICTIONARY_TAGS_TABLE,
} from '../dictionariesDatabase'
import {
  DatabaseTermEntryWithId,
  Tag,
} from '../../vendor/yomitan/types/ext/dictionary-database'
import { YomitanMediaRecord } from './importYomitanEntries'
import { TermGlossaryStructuredContent } from '../../vendor/yomitan/types/ext/dictionary-data'
import { Element } from '../../vendor/yomitan/types/ext/structured-content'
import { getImageMediaTypeFromFileName } from '../../vendor/yomitan/ext/js/media/media-util'

export async function lookUpYomitan(
  activeDictionariesIds: Set<string>,
  text: string
): Promise<{
  translations: TextTokensTranslations<DatabaseTermEntryWithId>
  tags: Record<string, Tag>
  media: Record<
    string,
    {
      record: YomitanMediaRecord
      url: ObjectURL
    }
  >
}> {
  const dexie = getDexieDb()
  const { tokensByIndex: potentialTokens, allTokens } = parseFlat(text, 12)

  const allLookupTokens = Array.from(allTokens, (token) => [
    token,
    // maybe memoize lemmatize in this function
    ...lemmatize(token).map((t) => t.text),
  ]).flat()
  console.log('text', text, 'allLookupTokens', allLookupTokens)
  const terms: DatabaseTermEntryWithId[] = await dexie
    .table(YOMITAN_DICTIONARY_TERMS_TABLE)
    .where('expression' satisfies keyof DatabaseTermEntryWithId)
    .anyOf(allLookupTokens)
    .or('reading' satisfies keyof DatabaseTermEntryWithId)
    .anyOf(allLookupTokens)
    .and((t: DatabaseTermEntryWithId) =>
      activeDictionariesIds.has(t.dictionary)
    )
    .distinct()
    .toArray()
  const tagNames = new Set<string>()
  for (const term of terms) {
    if (term.termTags)
      term.termTags.split(' ').forEach((tag) => tagNames.add(tag))
    if (term.definitionTags)
      term.definitionTags.split(' ').forEach((tag) => tagNames.add(tag))
  }
  const tags: Tag[] = await dexie
    .table(YOMITAN_DICTIONARY_TAGS_TABLE)
    .where('name' satisfies keyof Tag)
    .anyOf([...tagNames])
    .toArray()
  console.log('terms', terms, tags)
  const tokensTranslations = potentialTokens.flatMap(({ tokens, index }) => {
    const translatedTokens = tokens.flatMap((token) => {
      const candidates = terms.flatMap((entry) => {
        const exactMatch = entry.expression === token || entry.reading === token

        const posTags = entry.tags ? entry.tags.split(' ') : []
        return [
          ...(exactMatch ? [{ entry, inflections: [] }] : []),
          ...lemmatize(token).flatMap((potentialLemma) => {
            const textIsMatching =
              potentialLemma.text === entry.expression ||
              potentialLemma.text === entry.reading

            return textIsMatching &&
              potentialLemma.wordClasses.some((wc) => posTags.includes(wc))
              ? [{ entry, inflections: potentialLemma.inferredInflections }]
              : []
          }),
        ]
      })

      const translatedTokensAtCharacterIndex: TranslatedToken<DatabaseTermEntryWithId>[] =
        candidates.length
          ? [
              {
                matchedTokenText: token,
                candidates: candidates.sort((a, b) => {
                  if (
                    [a.entry.expression, b.entry.expression].filter(
                      (expression) => expression === token
                    ).length !== 1
                  ) {
                    const inflectionsDifference =
                      a.inflections.length - b.inflections.length
                    if (inflectionsDifference) return inflectionsDifference

                    const aScore =
                      typeof a.entry.score === 'number'
                        ? a.entry.score
                        : Infinity
                    const bScore =
                      typeof b.entry.score === 'number'
                        ? b.entry.score
                        : Infinity

                    const frequencyDifference = bScore - aScore

                    return frequencyDifference
                  } else {
                    return a.entry.expression === token ? -1 : 1
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
  })

  const media: Record<string, { record: YomitanMediaRecord; url: ObjectURL }> =
    {}
  for (const term of terms) {
    // get media for glossary.type === 'image' or 'structured content'
    for (const glossaryItem of term.glossary) {
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
    translations: {
      tokensTranslations,
      characterIndexToTranslationsMappings: [],
    },
    tags: Object.fromEntries(tags.map((tag) => [tag.name, tag])),
    media,
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
