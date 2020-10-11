import React, { Fragment, memo, ReactNode, useCallback } from 'react'
import { ClickAwayListener, IconButton, Paper, Popper } from '@material-ui/core'
import usePopover from '../utils/usePopover'
import css from './DictionaryPopover.module.css'
import { tokenize } from 'wanakana'
import { LexiconMainEntry } from '../files/dictionaryFile'
import { TranslatedTokensAtCharacterIndex } from '../utils/dictionariesDatabase'
import { Close } from '@material-ui/icons'
import DarkTheme from './DarkTheme'

// TODO: language codes here and for clozefield

function groupIdenticalEntryHeads(
  entries: {
    entry: LexiconMainEntry
    inflections: string[]
  }[]
) {
  const results: {
    head: string
    pronunciation: string | null
    entries: {
      entry: LexiconMainEntry
      inflections: string[]
    }[]
  }[] = []
  for (const entryWithInflection of entries) {
    const { entry, inflections } = entryWithInflection
    const existingHead = results.find(
      r => r.head === entry.head && r.pronunciation === entry.pronunciation
    )
    if (existingHead) {
      existingHead.entries.push(entryWithInflection)
    } else {
      results.push({
        head: entry.head,
        pronunciation: entry.pronunciation,
        entries: [entryWithInflection],
      })
    }
  }
  return results
}

export function DictionaryPopover({
  popover,
  translationsAtCharacter,
  activeDictionaryType,
}: {
  popover: ReturnType<typeof usePopover>
  translationsAtCharacter: TranslatedTokensAtCharacterIndex[]
  activeDictionaryType: DictionaryFileType
}) {
  return (
    <ClickAwayListener onClickAway={e => popover.close(e as any)}>
      <Popper open={true} anchorEl={popover.anchorEl}>
        <Paper className={css.container}>
          <DarkTheme>
            <IconButton
              size="small"
              onClick={popover.close}
              className={css.closeButton}
            >
              <Close />
            </IconButton>
          </DarkTheme>
          {!translationsAtCharacter.length && <>No results</>}
          {translationsAtCharacter.map(tokenTranslations => {
            return tokenTranslations.translatedTokens.map(translatedToken => {
              return groupIdenticalEntryHeads(translatedToken.candidates).map(
                ({ entries, head, pronunciation }, i) => {
                  return (
                    <section
                      className={css.dictionaryEntry}
                      key={`${head}${i}`}
                    >
                      <h3 className={css.entryHead}>
                        <EntryHead
                          head={head}
                          pronunciation={pronunciation}
                          activeDictionaryType={activeDictionaryType}
                        />
                      </h3>
                      {entries.map(({ entry, inflections }, i) => {
                        return (
                          <Fragment key={`${entry.head}_${i}`}>
                            <p className={css.entryTags}>
                              {entry.tags}
                              {Boolean(inflections.length) && (
                                <> ({inflections.join(' › ')})</>
                              )}
                            </p>
                            <p className={css.entryMeaningsList}>
                              {entry.meanings.join('; ')}
                            </p>
                          </Fragment>
                        )
                      })}
                    </section>
                  )
                }
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
  pronunciation,
}: {
  activeDictionaryType: DictionaryFileType
  head: string
  pronunciation: string | null
}) {
  switch (activeDictionaryType) {
    case 'YomichanDictionary':
      return <JapaneseRuby head={head} pronunciation={pronunciation} />
    case 'CEDictDictionary':
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
      <span className={css.japaneseEntryHeadWithFurigana}>
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
                    ) // -1?
                  : pronunciation.length // -1?
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
              console.log('processedPronunciation', acc.processedPronunciation)

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
