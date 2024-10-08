import {
  EventHandler,
  Fragment,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { useDispatch } from 'react-redux'
import {
  Button,
  ClickAwayListener,
  ClickAwayListenerProps,
  IconButton,
  Paper,
  Popper,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { tokenize } from 'wanakana'
import usePopover from '../utils/usePopover'
import css from './DictionaryPopover.module.css'
import { numberToMark } from 'pinyin-utils'
import { LexiconEntry } from '../files/dictionaryFile'
import {
  TranslatedToken,
  TranslatedTokensAtCharacterIndex,
} from '../utils/dictionariesDatabase'
import DarkTheme from './DarkTheme'
import { actions } from '../actions'
import { displayDictionaryType } from '../selectors'

/** groups lookup results pointing to entries with identical heads
 * to avoid displaying the same head multiple times;
 * other entry properties may differ, so further processing is needed
 * to determine if the entries belong together (see `groupEntriesAndOrganizeVariantHeads`)
 */
function groupIdenticalEntryHeads(
  translatedToken: TranslatedToken,
  sortEntriesFn?: (a: LexiconEntry, b: LexiconEntry) => number
) {
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
      (r) => r.head === entry.head && r.pronunciation === entry.pronunciation
    )
    if (existingHead) {
      existingHead.entries.push(entryWithInflection)
      if (sortEntriesFn)
        existingHead.entries.sort((a, b) => sortEntriesFn(a.entry, b.entry))
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

/** takes lookup results already grouped by identical heads
 * and looks at their inflections and tags to determine
 * if they should be displayed together
 */
const groupEntriesAndOrganizeVariantHeads = (
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
    const existing = result.find((e) => doEntriesBelongTogether(e, entry))
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

  return result
}

/** */
function doEntriesBelongTogether(
  e: {
    head: string
    inflections: string[]
    tags: string[]
    entries: LexiconEntry[]
  },
  entry: { entry: LexiconEntry; inflections: string[] }
): unknown {
  return (
    e.head === entry.entry.head &&
    new Set([...e.inflections, ...entry.inflections]).size ===
      entry.inflections.length &&
    new Set([
      ...e.tags,
      ...(entry.entry.tags ? entry.entry.tags.split(/\s/) : []),
    ]).size === e.tags.length
  )
}

export function DictionaryPopover({
  popover,
  translationsAtCharacter,
  activeDictionaryType,
}: {
  popover: ReturnType<typeof usePopover>
  translationsAtCharacter: TranslatedTokensAtCharacterIndex | null
  activeDictionaryType: DictionaryFileType | null
}) {
  const { close: closePopover } = popover
  const closeOnClickAway: ClickAwayListenerProps['onClickAway'] = useCallback(
    (e) => closePopover(e),
    [closePopover]
  )
  const stopPropagation: EventHandler<any> = useCallback(
    (e) => e.stopPropagation(),
    []
  )

  const ref = useRef<HTMLDivElement>(null)
  const textCharacterIndex =
    translationsAtCharacter && translationsAtCharacter.textCharacterIndex
  useEffect(() => {
    const el = ref.current
    if (el) {
      el.scrollTo(0, 0)
    }
  }, [textCharacterIndex])

  const dispatch = useDispatch()
  const openDictionarySettings = useCallback(() => {
    dispatch(actions.dictionariesDialog())
  }, [dispatch])

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
          {!translationsAtCharacter && activeDictionaryType && (
            <section style={{ textAlign: 'center' }}>
              <p>No results found.</p>
              <p>{displayDictionaryType(activeDictionaryType)}.</p>
              <p>
                <Button size="small" onClick={openDictionarySettings}>
                  Dictionary settings
                </Button>
              </p>
            </section>
          )}
          {!activeDictionaryType && (
            <>
              <p>Please activate a dictionary to look up words.</p>
              <p style={{ textAlign: 'center' }}>
                <Button size="small" onClick={openDictionarySettings}>
                  Dictionary settings
                </Button>
              </p>
            </>
          )}

          {translationsAtCharacter &&
            activeDictionaryType &&
            translationsAtCharacter.translatedTokens.map((translatedToken) => {
              return groupIdenticalEntryHeads(
                translatedToken,
                activeDictionaryType === 'DictCCDictionary'
                  ? (a, b) => {
                      // prioritize entries not containing text [obs.]
                      const aHasObs = a.meanings[0]?.includes('[obs.]')
                      const bHasObs = b.meanings[0]?.includes('[obs.]')

                      if (aHasObs && !bHasObs) return 1
                      if (!aHasObs && bHasObs) return -1
                      return 0
                    }
                  : undefined
              ).map(({ entries, head, variant, pronunciation }, i) => {
                return (
                  <section className={css.dictionaryEntry} key={`${head}${i}`}>
                    <h3 className={css.entryHead}>
                      <EntryHead
                        head={head}
                        variant={variant}
                        pronunciation={pronunciation}
                        activeDictionaryType={activeDictionaryType}
                      />
                    </h3>
                    {groupEntriesAndOrganizeVariantHeads(entries).map(
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
                              {entries
                                .flatMap((e) => e.meanings)

                                .join('; ')}
                            </p>
                          </Fragment>
                        )
                      }
                    )}
                  </section>
                )
              })
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
              const chunkString =
                typeof chunk === 'string' ? chunk : chunk.value
              if (
                pronunciation.substr(
                  acc.processedPronunciation.length,
                  chunkString.length
                ) === chunk
              ) {
                acc.processedPronunciation += chunk
                acc.elements.push(<>{chunk}</>)
              } else {
                const nextChunk = chunks[i + 1]
                const nextChunkText = nextChunk
                  ? typeof nextChunk === 'string'
                    ? nextChunk
                    : nextChunk.value
                  : null
                const nextTokenIndex = nextChunkText
                  ? pronunciation.indexOf(
                      nextChunkText,
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
                    {chunkString}
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
              .map((p) => numberToMark(p))
              .join(' ')}
        </rt>
      </ruby>
    )
  }
)
