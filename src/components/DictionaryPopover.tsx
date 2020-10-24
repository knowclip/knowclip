import React, {
  Fragment,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { ClickAwayListener, IconButton, Paper, Popper } from '@material-ui/core'
import usePopover from '../utils/usePopover'
import css from './DictionaryPopover.module.css'
import { tokenize } from 'wanakana'
import { LexiconEntry } from '../files/dictionaryFile'
import {
  TranslatedToken,
  TranslatedTokensAtCharacterIndex,
} from '../utils/dictionariesDatabase'
import { Close } from '@material-ui/icons'
import DarkTheme from './DarkTheme'
import { numberToMark } from 'pinyin-utils'

// TODO: language codes here and for clozefield

function groupIdenticalEntryHeads(translatedToken: TranslatedToken) {
  const results: {
    head: string
    variant?: string
    pronunciation: string | null
    entries: {
      entry: LexiconEntry
      inflections: string[]
    }[]
  }[] = []
  for (const entryWithInflection of translatedToken.candidates) {
    const { entry } = entryWithInflection
    const existingHead = results.find(
      r => r.head === entry.head && r.pronunciation === entry.pronunciation
    )
    // && !r.variant
    if (existingHead) {
      existingHead.entries.push(entryWithInflection)
    } else {
      results.push({
        head:
          translatedToken.matchedTokenText === entry.variant
            ? entry.variant
            : entry.head,
        variant:
          translatedToken.matchedTokenText === entry.variant
            ? entry.head
            : entry.variant || undefined,
        pronunciation: entry.pronunciation,
        entries: [entryWithInflection],
      })
    }
  }
  return results
}

const groupEntries = (
  entries: {
    entry: LexiconEntry
    inflections: string[]
  }[]
) => {
  const result: {
    head: string
    inflections: string[]
    tags: string[]

    entries: LexiconEntry[]
  }[] = []

  for (const entry of entries) {
    const existing = result.find(
      e =>
        e.head === entry.entry.head &&
        new Set([...e.inflections, ...entry.inflections]).size ===
          entry.inflections.length &&
        new Set([
          ...e.tags,
          ...(entry.entry.tags ? entry.entry.tags.split(/\s/) : []),
        ]).size === e.tags.length
    )
    if (existing) {
      existing.entries.push(entry.entry)
    } else {
      result.push({
        head: entry.entry.head,
        inflections: entry.inflections,
        tags: entry.entry.tags ? entry.entry.tags.split(/\s/) : [],

        entries: [entry.entry],
      })
    }
  }

  console.log({ entries, result: [...result] })

  return result
}

export function DictionaryPopover({
  popover,
  translationsAtCharacter,
  activeDictionaryType,
}: {
  popover: ReturnType<typeof usePopover>
  translationsAtCharacter: TranslatedTokensAtCharacterIndex | null
  activeDictionaryType: DictionaryFileType
}) {
  const { close: closePopover } = popover
  const closeOnClickAway = useCallback(e => closePopover(e), [closePopover])
  const stopPropagation = useCallback(e => e.stopPropagation(), [])

  const ref = useRef<HTMLElement>()
  const textCharacterIndex =
    translationsAtCharacter && translationsAtCharacter.textCharacterIndex
  useEffect(
    () => {
      const el = ref.current
      if (el) {
        el.scrollTo(0, 0)
      }
    },
    [textCharacterIndex]
  )

  return (
    <ClickAwayListener onClickAway={closeOnClickAway}>
      <Popper
        open={true}
        anchorEl={popover.anchorEl}
        onMouseDown={stopPropagation}
      >
        <Paper className={css.container} ref={ref}>
          <DarkTheme>
            <IconButton
              size="small"
              onClick={popover.close}
              className={css.closeButton}
            >
              <Close />
            </IconButton>
          </DarkTheme>
          {!translationsAtCharacter && <>No results</>}
          {translationsAtCharacter &&
            translationsAtCharacter.translatedTokens.map(translatedToken => {
              return groupIdenticalEntryHeads(translatedToken).map(
                ({ entries, head, variant, pronunciation }, i) => {
                  return (
                    <section
                      className={css.dictionaryEntry}
                      key={`${head}${i}`}
                    >
                      <h3 className={css.entryHead}>
                        <EntryHead
                          head={head}
                          variant={variant}
                          pronunciation={pronunciation}
                          activeDictionaryType={activeDictionaryType}
                        />
                      </h3>
                      {groupEntries(entries).map(
                        ({ entries, head, tags, inflections }, i) => {
                          return (
                            <Fragment key={`${head}_${i}`}>
                              <p className={css.entryTags}>
                                {tags.join(' ')}
                                {Boolean(inflections.length) && (
                                  <> ({inflections.join(' › ')})</>
                                )}
                              </p>
                              <p className={css.entryMeaningsList}>
                                {entries.flatMap(e => e.meanings).join('; ')}
                              </p>
                            </Fragment>
                          )
                        }
                      )}
                    </section>
                  )
                }
              )
            })}
        </Paper>
      </Popper>
    </ClickAwayListener>
  )
}

function EntryHead({
  activeDictionaryType,
  head,
  variant,
  pronunciation,
}: {
  activeDictionaryType: DictionaryFileType
  head: string
  variant?: string
  pronunciation: string | null
}) {
  switch (activeDictionaryType) {
    case 'YomichanDictionary':
      return <JapaneseRuby head={head} pronunciation={pronunciation} />
    case 'CEDictDictionary':
      return (
        <span className={css.entryHeadWithRuby}>
          <ChineseRuby head={head} pronunciation={pronunciation} />
          {variant && (
            <>
              ・<ChineseRuby head={variant} pronunciation={pronunciation} />
            </>
          )}
        </span>
      )
    case 'DictCCDictionary':
      return <>{head}</>
  }
}

const JapaneseRuby = memo(
  ({ head, pronunciation }: { head: string; pronunciation: string | null }) => {
    if (!pronunciation)
      return <span className={css.japaneseEntryHead}>{head}</span>

    const chunks = tokenize(head)
    return (
      <span className={css.entryHeadWithRuby}>
        {
          chunks.reduce(
            (acc, chunk, i) => {
              if (
                pronunciation.substr(
                  acc.processedPronunciation.length,
                  chunk.length
                ) === chunk
              ) {
                acc.processedPronunciation += chunk
                acc.elements.push(<>{chunk}</>)
              } else {
                const nextChunk: string | undefined = chunks[i + 1]
                const nextTokenIndex = nextChunk
                  ? pronunciation.indexOf(
                      nextChunk,
                      acc.processedPronunciation.length
                    )
                  : pronunciation.length
                const furigana = pronunciation.slice(
                  acc.processedPronunciation.length,
                  nextTokenIndex
                )
                acc.processedPronunciation += furigana
                acc.elements.push(
                  <ruby>
                    {chunk}
                    <rt>{furigana}</rt>
                  </ruby>
                )
              }
              return acc
            },
            { processedPronunciation: '', elements: [] } as {
              processedPronunciation: string
              elements: ReactNode[]
            }
          ).elements
        }
      </span>
    )
  }
)

const ChineseRuby = memo(
  ({ head, pronunciation }: { head: string; pronunciation: string | null }) => {
    return (
      <ruby>
        {head}{' '}
        <rt>
          {pronunciation &&
            pronunciation
              .split(/\s+/)
              .map(p => numberToMark(p))
              .join(' ')}
        </rt>
      </ruby>
    )
  }
)
