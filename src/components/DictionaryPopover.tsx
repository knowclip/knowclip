import {
  EventHandler,
  Fragment,
  memo,
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
import usePopover from '../utils/usePopover'
import css from './DictionaryPopover.module.css'
import { numberToMark } from 'pinyin-utils'
import { LegacyLexiconEntry } from '../files/dictionaryFile'
import {
  LexiconEntry,
  TokenTranslation,
  TranslatedToken,
} from '../utils/dictionariesDatabase'
import DarkTheme from './DarkTheme'
import { actions } from '../actions'
import { displayDictionaryType } from '../selectors'
import { DatabaseTermEntryWithId } from '../vendor/yomitan/types/ext/dictionary-database'
import { DictionaryPopoverJapaneseRuby } from './DictionaryPopoverJapaneseRuby'
import { DictionaryPopoverYomitanContent } from './DictionaryPopoverYomitanContent'
import { lookUpYomitan } from '../utils/dictionaries/lookUpYomitan'
import { TranslatedTokensAtCharacterIndex } from '../utils/dictionaries/findTranslationsAtCharIndex'
import { TransformedText } from '../vendor/yomitan/types/ext/language-transformer-internal'

/** groups lookup results pointing to entries with identical heads
 * to avoid displaying the same head multiple times;
 * other entry properties may differ, so further processing is needed
 * to determine if the entries belong together (see `groupEntriesAndOrganizeVariantHeads`)
 */
function groupIdenticalEntryHeads(
  translatedToken: TranslatedToken<LegacyLexiconEntry>,
  sortEntriesFn?: (a: LegacyLexiconEntry, b: LegacyLexiconEntry) => number
) {
  const results: {
    head: string
    variant?: string
    pronunciation: string | null
    entries: TokenTranslation<LegacyLexiconEntry>[]
  }[] = []
  for (const entryWithInflection of translatedToken.matches) {
    const { entry } = entryWithInflection
    if ('head' in entry) {
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
  }
  return results
}

/** takes lookup results already grouped by identical heads
 * and looks at their inflections and tags to determine
 * if they should be displayed together
 */
const groupEntriesAndOrganizeVariantHeads = (
  entries: TokenTranslation<LegacyLexiconEntry, string[]>[]
) => {
  const result: {
    head: string
    inflections: string[]
    tags: string[]

    entries: LegacyLexiconEntry[]
  }[] = []

  for (const entry of entries) {
    const existing = result.find((e) => doEntriesBelongTogether(e, entry))
    if (existing) {
      existing.entries.push(entry.entry)
    } else {
      result.push({
        head: entry.entry.head,
        inflections: entry.inflections || [],
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
    entries: LegacyLexiconEntry[]
  },
  entry: TokenTranslation<LegacyLexiconEntry, string[]>
): unknown {
  return (
    e.head === entry.entry.head &&
    new Set([...e.inflections, ...(entry.inflections || [])]).size ===
      (entry.inflections?.length || 0) &&
    new Set([
      ...e.tags,
      ...(entry.entry.tags ? entry.entry.tags.split(/\s/) : []),
    ]).size === e.tags.length
  )
}

export function DictionaryPopover<
  EntryType extends LexiconEntry,
  InflectionType
>({
  popover,
  translationsAtCharacter,
  activeDictionaryType,
  yomitanLookupResult,
}: {
  popover: ReturnType<typeof usePopover>
  translationsAtCharacter: TranslatedTokensAtCharacterIndex<
    EntryType,
    InflectionType
  > | null
  activeDictionaryType: DictionaryFileType | null
  yomitanLookupResult: Awaited<ReturnType<typeof lookUpYomitan>> | null
}) {
  console.log({ yomitanLookupResult })
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
          {yomitanLookupResult && (
            <DictionaryPopoverYomitanContent
              yomitanLookupResult={yomitanLookupResult}
              translationsAtCharacter={
                translationsAtCharacter as TranslatedTokensAtCharacterIndex<
                  DatabaseTermEntryWithId,
                  TransformedText
                >
              }
            />
          )}
          {translationsAtCharacter &&
            activeDictionaryType &&
            activeDictionaryType !== 'YomitanDictionary' &&
            (
              translationsAtCharacter.translatedTokens as TranslatedToken<LegacyLexiconEntry>[]
            ).map((translatedToken) => {
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
                            <div className={css.entryMeaningsList}>
                              {entries.flatMap((e) => e.meanings).join('; ')}
                            </div>
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
      return (
        <DictionaryPopoverJapaneseRuby
          head={head}
          pronunciation={pronunciation}
        />
      )
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
    case 'YomitanDictionary':
      return (
        <DictionaryPopoverJapaneseRuby
          head={head}
          pronunciation={pronunciation}
        />
      )
  }
}

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
