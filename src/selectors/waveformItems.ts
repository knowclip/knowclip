import { createSelector } from 'reselect'
import { getSubtitlesCardBases, WaveformSelectionExpanded } from './cardPreview'
import { getCurrentFileClips } from './currentMedia'
import { overlapsSignificantly } from './subtitles'

export const getHalfSecond = ({ waveform }: AppState) =>
  (waveform.stepsPerSecond * waveform.stepLength) / 2

export const getWaveformItems = createSelector(
  getCurrentFileClips,
  getHalfSecond,
  getSubtitlesCardBases,
  (clips, halfSecond, subtitles): Array<WaveformSelectionExpanded> => {
    const result: Array<WaveformSelectionExpanded> = []

    let clipIndex = 0
    let chunkIndex = 0

    const { cards: chunks } = subtitles

    while (clipIndex < clips.length && chunkIndex < chunks.length) {
      const clip = clips[clipIndex]
      const chunk = chunks[chunkIndex]

      if (clip.start <= chunk.start) {
        result.push({
          type: 'Clip',
          id: clip.id,
          index: result.length,
          item: clip,
        })
        clipIndex += 1

        for (
          let i = chunkIndex;
          i < chunks.length &&
          overlapsSignificantly(chunks[i], clip.start, clip.end, halfSecond);
          i++
        ) {
          chunkIndex += 1
        }
      } else {
        if (!overlapsSignificantly(chunk, clip.start, clip.end, halfSecond))
          result.push({
            type: 'Preview',
            index: result.length,
            item: chunk,
            cardBaseIndex: chunk.index,
          })
        chunkIndex += 1
      }
    }
    for (let i = clipIndex; i < clips.length; i++) {
      result.push({
        type: 'Clip',
        id: clips[i].id,
        index: result.length,
        item: clips[i],
      })
    }
    for (let i = chunkIndex; i < chunks.length; i++) {
      result.push({
        type: 'Preview',
        index: result.length,
        item: chunks[i],
        cardBaseIndex: chunks[i].index,
      })
    }

    return result
  }
)

export const getWaveformSelection = createSelector(
  (state: AppState) => state.session.waveformSelection,
  getSubtitlesCardBases,
  (state: AppState) => state.clips.byId,
  getWaveformItems,
  (
    selection,
    cardsBases,
    clipsById,
    items
  ): WaveformSelectionExpanded | null => {
    if (!selection) return null

    switch (selection.type) {
      case 'Clip':
        return {
          ...selection,
          item: clipsById[selection.id],
        }
      case 'Preview':
        return {
          ...selection,
          item: cardsBases.cards[selection.cardBaseIndex],
        }
    }
  }
)

export const getNewWaveformSelectionAt = (
  state: AppState,
  x: number
): WaveformSelectionExpanded | null => {
  return (
    getWaveformItems(state).find(
      ({ item }) => x >= item.start && x <= item.end
    ) || null
  )
}
