import '../vendor/yomitan/ext/css/structured-content.css'
import '../vendor/yomitan/ext/css/material.css'
import '../vendor/yomitan/ext/css/display.css'

import clsx from 'clsx'
import { css } from 'clipwave'
import { useRef, useLayoutEffect, useEffect, createElement } from 'react'
import { TranslatedTokensAtCharacterIndex } from '../utils/dictionaries/findTranslationsAtCharIndex'
import { StructuredContentGenerator } from '../vendor/yomitan/ext/js/display/structured-content-generator'
import {
  DatabaseTermEntryWithId,
  Tag,
} from '../vendor/yomitan/types/ext/dictionary-database'
import { DictionaryPopoverJapaneseRuby } from './DictionaryPopoverJapaneseRuby'
import { lookUpYomitan } from '../utils/dictionaries/lookUpYomitan'
import { Tooltip } from '@mui/material'
import { TransformedText } from '../vendor/yomitan/types/ext/language-transformer-internal'
import { TokenTranslation } from '../utils/dictionariesDatabase'

function groupTranslationsByExpressionAndReadingAndRules(
  tokenTranslations: TokenTranslation<
    DatabaseTermEntryWithId,
    TransformedText
  >[]
) {
  const groups: {
    expression: string
    reading: string
    rules: string
    entries: DatabaseTermEntryWithId[]
    translations: {
      entryId: number
      inflections: TransformedText[]
    }[]
  }[] = []
  for (const tokenTranslation of tokenTranslations) {
    const { expression, reading, rules } = tokenTranslation.entry
    const group = groups.find(
      (group) =>
        group.expression === expression &&
        group.reading === reading &&
        group.rules === rules
    )

    if (group) {
      const existingTranslation = group.translations.find(
        (t) => t.entryId === tokenTranslation.entry.id
      )
      if (!existingTranslation) group.entries.push(tokenTranslation.entry)

      if (existingTranslation) {
        if (tokenTranslation.inflections)
          existingTranslation.inflections.push(tokenTranslation.inflections)
      } else
        group.translations.push({
          entryId: tokenTranslation.entry.id,
          inflections: tokenTranslation.inflections
            ? [tokenTranslation.inflections]
            : [],
        })
    } else {
      groups.push({
        expression,
        reading,
        rules,
        entries: [tokenTranslation.entry],
        translations: [
          {
            entryId: tokenTranslation.entry.id,
            inflections: tokenTranslation.inflections
              ? [tokenTranslation.inflections]
              : [],
          },
        ],
      })
    }
  }
  return groups
}

const lang = 'ja'
export function DictionaryPopoverYomitanContent({
  yomitanLookupResult,
  translationsAtCharacter,
}: {
  yomitanLookupResult: NonNullable<Awaited<ReturnType<typeof lookUpYomitan>>>
  translationsAtCharacter: TranslatedTokensAtCharacterIndex<
    DatabaseTermEntryWithId,
    TransformedText
  >
}) {
  const structuredContentGenerator = useStructuredContentGenerator()

  if (!translationsAtCharacter) return null

  return (
    <section className={css.dictionaryEntry}>
      {translationsAtCharacter.translatedTokens.map((translatedToken, i) => {
        return (
          <div key={i} className="dictionary-entries">
            {groupTranslationsByExpressionAndReadingAndRules(
              translatedToken.matches
            ).map(
              ({ expression, reading, translations, rules, entries }, i) => {
                // deinflection
                if (
                  entries.every((e) =>
                    e.glossary.every((g) => Array.isArray(g))
                  )
                )
                  return null

                const key = String(i)
                const { combinedTermTagsString, combinedDefinitionTagsString } =
                  aggregateTagsFromTranslations(entries)
                return (
                  <div key={key} className="entry" style={{ padding: 0 }}>
                    <EntryHeader
                      rules={rules}
                      head={expression}
                      pronunciation={reading}
                      termTags={combinedTermTagsString}
                      definitionTags={combinedDefinitionTagsString}
                      yomitanLookupResult={yomitanLookupResult}
                    />
                    <div className="entry-body">
                      <div className="entry-body-section">
                        <ol
                          className="entry-body-section-content definition-list"
                          data-count={translations.length}
                        >
                          {entries.map((translation, i) => {
                            const { glossary } = translation
                            const dictionaryId = translation.dictionary
                            const dictionaryMetadata =
                              yomitanLookupResult.dictionaryIdsToMetadatas.get(
                                dictionaryId
                              )
                            const dictionaryTag: Tag = {
                              name: dictionaryMetadata?.indexJson
                                ?.title as string,
                              score: 0,
                              category: 'dictionary',
                              notes: '',
                              order: 2,
                              dictionary: dictionaryId,
                            }
                            const definitionTags = getTags(
                              translation.definitionTags || undefined,
                              yomitanLookupResult.tags
                            ).concat(dictionaryTag)
                            return (
                              <div
                                key={String(i)}
                                className="definition-item"
                                data-index={i}
                              >
                                <div
                                  key={String(i)}
                                  className="definition-item-content"
                                >
                                  <TagsList
                                    className="definition-tag-list"
                                    tags={definitionTags}
                                  />
                                </div>
                                <div className="definition-item-inner">
                                  <ul
                                    className="gloss-list"
                                    data-count={glossary.length}
                                  >
                                    {glossary.map((glossary, i) => {
                                      {
                                        const key = String(i)
                                        if (typeof glossary === 'string') {
                                          return (
                                            <li
                                              className="gloss-item"
                                              key={key}
                                            >
                                              <span className="gloss-content">
                                                {glossary}
                                              </span>
                                            </li>
                                          )
                                        }
                                        // deinflection
                                        if (Array.isArray(glossary)) {
                                          return (
                                            <li
                                              className="gloss-item"
                                              key={key}
                                            >
                                              <span className="gloss-content">
                                                {glossary[0]}
                                              </span>
                                            </li>
                                          )
                                        }

                                        if (glossary.type === 'text') {
                                          return (
                                            <li
                                              className="gloss-item"
                                              key={key}
                                            >
                                              <span className="gloss-content">
                                                {glossary.text}
                                              </span>
                                            </li>
                                          )
                                        }

                                        if (
                                          glossary.type === 'structured-content'
                                        ) {
                                          return (
                                            <StructuredContent
                                              key={key}
                                              tag="li"
                                              className="gloss-item gloss-content"
                                              json={glossary.content}
                                              generator={
                                                structuredContentGenerator
                                              }
                                              lookupResult={yomitanLookupResult}
                                            />
                                          )
                                        }

                                        if (glossary.type === 'image') {
                                          return (
                                            <li
                                              className="gloss-item"
                                              key={key}
                                            >
                                              [Image]
                                            </li>
                                          )
                                        }

                                        return (
                                          <li className="gloss-item" key={key}>
                                            [Unknown content format]
                                          </li>
                                        )
                                      }
                                    })}
                                  </ul>
                                </div>
                              </div>
                            )
                          })}
                        </ol>
                      </div>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        )
      })}
    </section>
  )
}

function aggregateTagsFromTranslations(
  translations: DatabaseTermEntryWithId[]
) {
  const combinedTermTags = new Set<string>()
  const combinedDefinitionTags = new Set<string>()
  for (const translation of translations) {
    for (const tag of translation.termTags?.split(' ') ?? []) {
      if (tag) combinedTermTags.add(tag)
    }
    if (translations.length === 1)
      for (const tag of translation.definitionTags?.split(' ') ?? []) {
        if (tag) combinedDefinitionTags.add(tag)
      }
  }
  const combinedTermTagsString = Array.from(combinedTermTags).join(' ')
  const combinedDefinitionTagsString = Array.from(combinedDefinitionTags).join(
    ' '
  )
  return { combinedTermTagsString, combinedDefinitionTagsString }
}

function EntryHeader({
  head,
  pronunciation,
  rules,
  termTags,
  definitionTags = '',
  yomitanLookupResult,
}: {
  head: string
  pronunciation: string
  rules: DatabaseTermEntryWithId['rules']
  termTags: string
  definitionTags?: string
  yomitanLookupResult: NonNullable<Awaited<ReturnType<typeof lookUpYomitan>>>
}) {
  return (
    <div className="entry-header">
      <div className="headword-list" data-count={1}>
        <div
          className="headword"
          data-is-primary="true"
          data-reading-is-same={head === pronunciation}
          data-frequency="normal"
          data-match-types="exact"
          data-match-sources="reading"
          data-word-classes={rules}
          data-index={0}
        >
          <div className="headword-text-container">
            <span className="headword-term-outer source-text">
              <span className="headword-term" lang={lang}>
                <DictionaryPopoverJapaneseRuby
                  head={head}
                  pronunciation={pronunciation}
                />
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="headword-list-details">
        <div
          className="headword-tags-list"
          data-count={termTags ? termTags.split(' ').length : 0}
        >
          {termTags.length ? (
            <TagsDisplay
              tagsString={termTags || undefined}
              yomitanLookupResult={yomitanLookupResult}
              className="headword-list-tag-list"
            />
          ) : null}
          {/* {definitionTags.length ? (
              <TagsDisplay
                tagsString={definitionTags || undefined}
                yomitanLookupResult={yomitanLookupResult}
                className="headword-list-tag-list"
              />
            ) : null} */}
        </div>
      </div>
    </div>
  )
}

function TagsDisplay({
  tagsString,
  yomitanLookupResult,
  className,
}: {
  tagsString: string | undefined
  yomitanLookupResult: NonNullable<Awaited<ReturnType<typeof lookUpYomitan>>>
  className?: string
}) {
  const tags = getTags(tagsString, yomitanLookupResult.tags)
  return (
    <span className={clsx(className, 'tag-list')} data-count={tags.length}>
      {tags.map((tag, i) => (
        <Tooltip title={tag.notes} key={tag.name}>
          <span className="tag" data-category={tag.category} data-index={i}>
            <span className="tag-label">
              <span className="tag-label-content">{tag.name}</span>
            </span>
          </span>
        </Tooltip>
      ))}
    </span>
  )
}
function TagsList({ tags, className }: { tags: Tag[]; className: string }) {
  return (
    <span className={clsx(className, 'tag-list')} data-count={tags.length}>
      {tags.map((tag, i) => (
        <Tooltip title={tag.notes} key={tag.name}>
          <span className="tag" data-category={tag.category} data-index={i}>
            <span className="tag-label">
              <span className="tag-label-content">{tag.name}</span>
            </span>
          </span>
        </Tooltip>
      ))}
    </span>
  )
}

function getTags(tagsString: string | undefined, tagsMap: Record<string, Tag>) {
  const tags: Tag[] = []
  const addedTags = new Set<string>()
  for (const tagName of tagsString?.split(' ') ?? []) {
    if (tagsMap[tagName] && !addedTags.has(tagName)) {
      tags.push(tagsMap[tagName])
      addedTags.add(tagName)
    }
  }
  return tags
}

function StructuredContent({
  json,
  generator,
  lookupResult,
  tag,
  className,
}: {
  json: unknown
  generator: React.MutableRefObject<StructuredContentGenerator | null>
  lookupResult: Awaited<ReturnType<typeof lookUpYomitan>>
  tag: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!generator.current) return

    if (ref.current) {
      const domElement = generator.current.createStructuredContent(
        json,
        'plcaaeholder'
      )

      const imgLinks = domElement.querySelectorAll(
        'a.gloss-image-link'
      ) as NodeListOf<HTMLAnchorElement>
      for (const imgLink of imgLinks) {
        const path = imgLink.dataset.path
        imgLink.dataset.sizeUnits = 'em'
        const media = path ? lookupResult.media[path] : null
        if (media) {
          const imgChild = imgLink.querySelector(
            'img.gloss-image'
          ) as HTMLImageElement
          if (imgChild) {
            imgChild.src = media.url
            imgLink.dataset.imageLoadState = 'loaded'
          }
        }
      }
      ref.current.replaceChildren(domElement)
    }
  }, [generator, json, lookupResult.media])
  return createElement(tag, { className, ref })
}

function useStructuredContentGenerator() {
  const ref = useRef<StructuredContentGenerator | null>(null)
  useEffect(() => {
    ref.current = new StructuredContentGenerator(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - not using this
      { prepareLink() {} },
      window.document
    )
  }, [])
  return ref
}
