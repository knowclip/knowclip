import '../vendor/yomitan/ext/css/structured-content.css'
import '../vendor/yomitan/ext/css/material.css'
import '../vendor/yomitan/ext/css/display.css'

import clsx from 'clsx'
import { css } from 'clipwave'
import { useRef, useLayoutEffect, useEffect, createElement } from 'react'
import { TranslatedTokensAtCharacterIndex } from '../utils/dictionariesDatabase'
import { StructuredContentGenerator } from '../vendor/yomitan/ext/js/display/structured-content-generator'
import {
  DatabaseTermEntryWithId,
  Tag,
} from '../vendor/yomitan/types/ext/dictionary-database'
import { DictionaryPopoverJapaneseRuby } from './DictionaryPopoverJapaneseRuby'
import { lookUpYomitan } from '../utils/dictionaries/lookUpYomitan'
import { Tooltip } from '@mui/material'

export function DictionaryPopoverYomitanContent({
  yomitanLookupResult,
  translationsAtCharacter,
}: {
  yomitanLookupResult: NonNullable<Awaited<ReturnType<typeof lookUpYomitan>>>
  translationsAtCharacter: TranslatedTokensAtCharacterIndex<DatabaseTermEntryWithId>
}) {
  const structuredContentGenerator = useStructuredContentGenerator()

  return (
    <section className={css.dictionaryEntry}>
      {translationsAtCharacter.translatedTokens.map((translatedToken, i) => {
        const groupedEntries: {
          head: string
          variant?: string
          pronunciation: string | null
          entries: {
            entry: DatabaseTermEntryWithId
            inflections: string[]
          }[]
        }[] = translatedToken.candidates.map((entryWithInflection) => {
          return {
            head: entryWithInflection.entry.expression,
            pronunciation: entryWithInflection.entry.reading,
            entries: [
              {
                entry: entryWithInflection.entry,
                inflections: entryWithInflection.inflections,
              },
            ],
          }
        })
        return (
          <div key={i} className="dictionary-entries">
            {groupedEntries.map(
              ({ head, variant, pronunciation, entries }, i) => {
                const key = String(i)
                return (
                  <div key={key} className="entry" style={{ padding: 0 }}>
                    {entries.map(({ entry }, i) => (
                      <div key={String(i)} className="definition-item-content">
                        <h3 className={css.entryHead}>
                          <DictionaryPopoverJapaneseRuby
                            head={head}
                            pronunciation={pronunciation}
                          />
                          {entry.termTags?.length ? (
                            <TagsDisplay
                              tagsString={entry.termTags || undefined}
                              yomitanLookupResult={yomitanLookupResult}
                            />
                          ) : null}
                        </h3>
                        {entry.definitionTags?.length ? (
                          <TagsDisplay
                            tagsString={entry.definitionTags}
                            yomitanLookupResult={yomitanLookupResult}
                          />
                        ) : null}
                        <ol
                          className={clsx('gloss-list')}
                          data-count={entry.glossary.length}
                        >
                          {entry.glossary.map((glossary, i) => {
                            const key = String(i)
                            if (typeof glossary === 'string') {
                              return (
                                <li className="gloss-item" key={key}>
                                  <span className="gloss-content">
                                    {glossary}
                                  </span>
                                </li>
                              )
                            }
                            // deinflection
                            if (Array.isArray(glossary)) {
                              return (
                                <li className="gloss-item" key={key}>
                                  <span className="gloss-content">
                                    {glossary[0]}
                                  </span>
                                </li>
                              )
                            }

                            if (glossary.type === 'text') {
                              return (
                                <li className="gloss-item" key={key}>
                                  <span className="gloss-content">
                                    {glossary.text}
                                  </span>
                                </li>
                              )
                            }

                            if (glossary.type === 'structured-content') {
                              return (
                                <StructuredContent
                                  key={key}
                                  tag="li"
                                  className="gloss-item gloss-content"
                                  json={glossary.content}
                                  generator={structuredContentGenerator}
                                  lookupResult={yomitanLookupResult}
                                />
                              )
                            }

                            if (glossary.type === 'image') {
                              return (
                                <li className="gloss-item" key={key}>
                                  [Image]
                                </li>
                              )
                            }

                            return (
                              <li className="gloss-item" key={key}>
                                [Unknown content format]
                              </li>
                            )
                          })}
                        </ol>
                      </div>
                    ))}
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

function TagsDisplay({
  tagsString,
  yomitanLookupResult,
}: {
  tagsString: string | undefined
  yomitanLookupResult: NonNullable<Awaited<ReturnType<typeof lookUpYomitan>>>
}) {
  const tags = getTags(tagsString, yomitanLookupResult.tags)
  return (
    <span
      className={clsx('definition-tag-list', 'tag-list')}
      data-count={tags.length}
    >
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
      console.log('structured content', domElement)

      const imgLinks = domElement.querySelectorAll(
        'a.gloss-image-link'
      ) as NodeListOf<HTMLAnchorElement>
      for (const imgLink of imgLinks) {
        // get "path" from dataset
        const path = imgLink.dataset.path
        imgLink.dataset.sizeUnits = 'em'
        const media = path ? lookupResult.media[path] : null
        console.log(`Path for image: ${path}`)
        if (media) {
          const imgChild = imgLink.querySelector(
            'img.gloss-image'
          ) as HTMLImageElement
          if (imgChild) {
            imgChild.src = media.url
            imgLink.dataset.imageLoadState = 'loaded'
          }
        }
        // const imgs
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
