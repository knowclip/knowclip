import { memo, ReactNode } from 'react'
import { tokenize } from 'wanakana'
import css from './DictionaryPopover.module.css'

export const DictionaryPopoverJapaneseRuby = memo(
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
