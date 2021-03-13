import React, { memo, useCallback } from 'react'
import cn from 'classnames'
import { useDispatch } from 'react-redux'
import r from '../redux'
import css from './Waveform.module.css'
import { setCursorX } from '../utils/waveform'
import {
  SubtitlesCardBases,
  SUBTITLES_CHUNK_HEIGHT,
  WaveformSelectionExpanded,
  WAVEFORM_HEIGHT,
} from '../selectors'
import { $ } from './Waveform'
import { SubtitlesCardBase } from '../selectors'

export const SubtitlesTimelines = memo(
  ({
    subtitles,
    waveformItems,
    goToSubtitlesChunk,
    highlightedChunkIndex,
  }: {
    subtitles: SubtitlesCardBases
    waveformItems: WaveformSelectionExpanded[]
    goToSubtitlesChunk: (trackId: string, chunkIndex: number) => void
    highlightedChunkIndex: number | null
  }) => {
    const handleClick = useCallback(
      (e) => {
        const { dataset } = e.target

        setCursorX(dataset.chunkStart)

        goToSubtitlesChunk(dataset.trackId, dataset.chunkIndex)

        if (e.target.classList.contains(css.subtitlesChunkRectangle)) {
          const currentSelected = document.querySelector(
            '.' + css.selectedSubtitlesChunk
          )
          if (currentSelected)
            currentSelected.classList.remove(css.selectedSubtitlesChunk)
          e.target.classList.add(css.selectedSubtitlesChunk)
        }
      },
      [goToSubtitlesChunk]
    )
    const dispatch = useDispatch()
    const handleDoubleClick = useCallback(
      (e) => {
        const { dataset } = e.target
        if (dataset && dataset.chunkIndex) {
          const item = waveformItems.find(
            (i): i is WaveformSelectionExpanded & { type: 'Preview' } =>
              i.type === 'Preview' && i.cardBaseIndex === +dataset.chunkIndex
          )
          if (item) dispatch(r.newCardFromSubtitlesRequest(item))
        }
      },
      [dispatch, waveformItems]
    )
    return (
      <g
        className={cn(css.subtitlesSvg, $.subtitlesTimelinesContainer)}
        width="100%"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {subtitles.cards.map((c) => {
          return (
            <LinkedSubtitlesChunk
              key={'linked' + c.index}
              cardBase={c}
              tracksCount={subtitles.fieldNames.length}
              linkedTrackIds={subtitles.linkedTrackIds}
              getFieldsPreview={subtitles.getFieldsPreviewFromCardsBase}
              isSelected={highlightedChunkIndex === c.index}
            />
          )
        })}
        {subtitles.excludedTracks.map(({ chunks, id }, trackIndex) => {
          const trackOffsetY =
            Object.keys(subtitles.fieldNames).length + trackIndex
          return (
            <g className={$.subtitlesTimelines} key={id}>
              {chunks.map((chunk) => (
                <SubtitlesChunk
                  key={`${chunk.start}_${chunk.text}`}
                  chunk={chunk}
                  trackOffsetY={trackOffsetY}
                  trackId={id}
                  chunkIndex={chunk.index}
                />
              ))}
            </g>
          )
        })}
      </g>
    )
  }
)

const SubtitlesChunk = React.memo(
  ({
    chunk,
    trackOffsetY,
    chunkIndex,
    trackId,
  }: {
    chunk: SubtitlesChunk
    trackOffsetY: number
    chunkIndex: number
    trackId: string
  }) => {
    const clipPathId = `${trackId}__${chunkIndex}`
    const width = chunk.end - chunk.start

    const rect = {
      x: chunk.start,
      y: WAVEFORM_HEIGHT + trackOffsetY * SUBTITLES_CHUNK_HEIGHT,
      width: width,
      height: SUBTITLES_CHUNK_HEIGHT,
    }

    const clickDataProps = {
      'data-track-id': trackId,
      'data-chunk-index': chunkIndex,
      'data-chunk-start': chunk.start,
    }

    return (
      <g className={css.subtitlesChunk} {...clickDataProps}>
        <clipPath id={clipPathId}>
          <rect {...rect} width={width - 10} />
        </clipPath>
        <rect
          className={css.subtitlesChunkRectangle}
          {...clickDataProps}
          {...rect}
          rx={SUBTITLES_CHUNK_HEIGHT / 2}
        />
        <text
          clipPath={`url(#${clipPathId})`}
          {...clickDataProps}
          className={css.subtitlesText}
          x={chunk.start + 6}
          y={(trackOffsetY + 1) * SUBTITLES_CHUNK_HEIGHT - 4 + WAVEFORM_HEIGHT}
        >
          {chunk.text}
        </text>
      </g>
    )
  }
)

const LinkedSubtitlesChunk = React.memo(
  ({
    cardBase,
    getFieldsPreview,
    linkedTrackIds,
    isSelected,
    tracksCount,
  }: {
    cardBase: SubtitlesCardBase
    getFieldsPreview: (base: SubtitlesCardBase) => Dict<string, string>
    linkedTrackIds: SubtitlesTrackId[]
    isSelected: boolean
    tracksCount: number
  }) => {
    const clipPathId = `linkedSubtitles_${cardBase.start}`
    const width = cardBase.end - cardBase.start

    const fieldsPreview = getFieldsPreview(cardBase)

    const rect = {
      x: cardBase.start,
      y: WAVEFORM_HEIGHT,
      width: width,
      height: SUBTITLES_CHUNK_HEIGHT * tracksCount,
    }

    const clickDataProps = {
      'data-track-id': linkedTrackIds[0],
      'data-chunk-index': cardBase.index,
      'data-chunk-start': cardBase.start,
    }

    return (
      <g className={css.subtitlesChunk} {...clickDataProps}>
        <clipPath id={clipPathId}>
          <rect {...rect} width={width - 10} />
        </clipPath>
        <rect
          className={cn(css.subtitlesChunkRectangle, {
            [css.selectedSubtitlesChunk]: isSelected,
          })}
          {...clickDataProps}
          {...rect}
          rx={SUBTITLES_CHUNK_HEIGHT / 2}
        />
        {linkedTrackIds.map((id, i) => {
          const i1 = 1 + i
          return (
            <text
              key={id + i}
              clipPath={`url(#${clipPathId})`}
              className={css.subtitlesText}
              x={cardBase.start + 6}
              y={i1 * SUBTITLES_CHUNK_HEIGHT - 4 + WAVEFORM_HEIGHT}
              {...clickDataProps}
            >
              {fieldsPreview[id]}
            </text>
          )
        })}
      </g>
    )
  }
)
