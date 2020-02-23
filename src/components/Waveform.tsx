import React, { memo, useRef, useCallback } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import * as r from '../redux'
import css from './Waveform.module.css'
import {
  toWaveformCoordinates,
  getSecondsAtXFromWaveform,
} from '../utils/waveformCoordinates'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'
import { setCursorX } from '../utils/waveform'

enum $ {
  container = 'waveform-container',
  subtitlesTimelinesContainer = 'subtitles-timelines-container',
  subtitlesTimelines = 'subtitles-timeline',
  waveformClipsContainer = 'waveform-clips-container',
  waveformClip = 'waveform-clip',
}

const { SELECTION_BORDER_WIDTH } = r
const WAVEFORM_HEIGHT = 70

const Cursor = ({ x, height }: { x: number; height: number }) => (
  <line
    className="cursor"
    stroke="white"
    x1={x}
    y1="-1"
    x2={x}
    y2={height}
    shapeRendering="crispEdges"
    style={{ pointerEvents: 'none' }}
  />
)

const getClipRectProps = (start: number, end: number, height: number) => ({
  x: start < end ? start : end,
  y: 0,
  width: start < end ? end - start : start - end,
  height: height,
})

type ClipProps = {
  id: string
  start: number
  end: number
  isHighlighted: boolean
  height: number
  index: number
}
type ClipClickDataProps = {
  'data-clip-id': string
  'data-clip-start': number
  'data-clip-end': number
  'data-clip-index': number
  'data-clip-is-highlighted'?: number
}
const Clip = ({ id, start, end, isHighlighted, height, index }: ClipProps) => {
  const clickDataProps: ClipClickDataProps = {
    'data-clip-id': id,
    'data-clip-start': start,
    'data-clip-end': end,
    'data-clip-index': index,
  }
  if (isHighlighted) clickDataProps['data-clip-is-highlighted'] = 1

  return (
    <g id={id} {...clickDataProps}>
      <rect
        className={cn(
          css.waveformClip,
          { [css.highlightedClip]: isHighlighted },
          $.waveformClip
        )}
        {...getClipRectProps(start, end, height)}
        {...clickDataProps}
      />

      <rect
        className={css.waveformClipBorder}
        x={start}
        y="0"
        width={SELECTION_BORDER_WIDTH}
        height={height}
        {...clickDataProps}
      />
      <rect
        className={cn(css.waveformClipBorder, {
          [css.highlightedClipBorder]: isHighlighted,
        })}
        x={end - SELECTION_BORDER_WIDTH}
        y="0"
        width={SELECTION_BORDER_WIDTH}
        height={height}
        {...clickDataProps}
      />
    </g>
  )
}

type ChunkProps = {
  start: number
  end: number
  stepsPerSecond: number
  height: number
}

const PendingClip = ({ start, end, height }: ChunkProps) => (
  <rect
    className={css.waveformPendingClip}
    {...getClipRectProps(start, end, height)}
  />
)

const PendingStretch = ({ start, end, height }: ChunkProps) => (
  <rect
    className={css.waveformPendingStretch}
    {...getClipRectProps(start, end, height)}
  />
)

const getViewBoxString = (xMin: number, height: number) =>
  `${xMin} 0 3000 ${height}`

const Clips = React.memo(
  ({
    clips,
    highlightedClipId,
    height,
    waveform,
  }: {
    clips: Clip[]
    highlightedClipId: string | null
    height: number
    waveform: WaveformState
  }) => {
    const handleClick = useCallback(
      e => {
        const { dataset } = e.target
        if (dataset && dataset.clipId) {
          if (!dataset.clipIsHighlighted) {
            const player = document.getElementById(
              'mediaPlayer'
            ) as HTMLVideoElement
            if (player)
              player.currentTime = getSecondsAtXFromWaveform(
                waveform,
                clips[dataset.clipIndex].start
              )
            setCursorX(clips[dataset.clipIndex].start)

            e.stopPropagation()
          } else {
          }
        }
      },
      [clips, waveform]
    )
    const handleMouseUp = useCallback(e => {
      const { dataset } = e.target
      if (dataset && dataset.clipId) {
        const currentSelected = document.querySelector(
          '.' + css.highlightedClip
        )
        if (currentSelected)
          currentSelected.classList.remove(css.highlightedClip)
        const newSelected = document.querySelector(
          `.${css.waveformClip}[data-clip-id="${dataset.clipId}"]`
        )
        if (newSelected) newSelected.classList.add(css.highlightedClip)
      }
    }, [])

    return (
      <g
        className={$.waveformClipsContainer}
        onClick={handleClick}
        onMouseUp={handleMouseUp}
      >
        {clips.map((clip, i) => (
          <Clip
            {...clip}
            index={i}
            key={clip.id}
            isHighlighted={clip.id === highlightedClipId}
            height={height}
          />
        ))}
      </g>
    )
  }
)

const SUBTITLES_CHUNK_HEIGHT = 14

const SubtitlesChunk = ({
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

const LinkedSubtitlesChunk = ({
  cardBase,
  index,
  fieldsPreview,
  linkedFieldNames,
  linkedTrackIds,
  isSelected,
}: {
  cardBase: r.SubtitlesCardBase
  index: number
  fieldsPreview: Dict<string, string>
  linkedFieldNames: TransliterationFlashcardFieldName[]
  linkedTrackIds: SubtitlesTrackId[]
  isSelected: boolean
}) => {
  const clipPathId = `linkedSubtitles_${cardBase.start}`
  const width = cardBase.end - cardBase.start

  const rect = {
    x: cardBase.start,
    y: WAVEFORM_HEIGHT,
    width: width,
    height: SUBTITLES_CHUNK_HEIGHT * linkedFieldNames.length,
  }

  const clickDataProps = {
    'data-track-id': linkedTrackIds[0],
    'data-chunk-index': index,
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

const SubtitlesTimelines = memo(
  ({
    subtitles,
    goToSubtitlesChunk,
    highlightedChunkIndex,
  }: {
    subtitles: r.SubtitlesCardBases
    goToSubtitlesChunk: (trackId: string, chunkIndex: number) => void
    highlightedChunkIndex: number | null
  }) => {
    const handleClick = useCallback(
      e => {
        e.stopPropagation()
        goToSubtitlesChunk(
          e.target.dataset.trackId,
          e.target.dataset.chunkIndex
        )

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

    return (
      <g
        className={cn(css.subtitlesSvg, $.subtitlesTimelinesContainer)}
        width="100%"
        onClick={handleClick}
      >
        {subtitles.cards.map((c, i) => {
          return (
            <LinkedSubtitlesChunk
              key={'linked' + i}
              cardBase={c}
              index={i}
              linkedFieldNames={subtitles.fieldNames}
              linkedTrackIds={subtitles.linkedTrackIds}
              fieldsPreview={subtitles.getFieldsPreviewFromCardsBase(c)}
              isSelected={highlightedChunkIndex === i}
            />
          )
        })}
        {subtitles.excludedTracks.map(({ chunks, id }, trackIndex) => {
          const trackOffsetY =
            Object.keys(subtitles.fieldNames).length + trackIndex
          return (
            <g className={$.subtitlesTimelines} key={id}>
              {chunks.map((chunk, index) => (
                <SubtitlesChunk
                  key={`${chunk.start}_${chunk.text}`}
                  chunk={chunk}
                  trackOffsetY={trackOffsetY}
                  trackId={id}
                  chunkIndex={index}
                />
              ))}
            </g>
          )
        })}
      </g>
    )
  }
)

const Waveform = ({ show }: { show: boolean }) => {
  const {
    waveform,
    path,
    clips,
    pendingClip,
    pendingStretch,
    highlightedClipId,
    subtitles,
    highlightedChunkIndex,
  } = useSelector((state: AppState) => ({
    waveform: r.getWaveform(state),
    path: r.getWaveformPath(state),
    clips: r.getCurrentFileClips(state),
    pendingClip: r.getPendingClip(state),
    pendingStretch: r.getPendingStretch(state),
    highlightedClipId: r.getHighlightedClipId(state),
    subtitles: r.getSubtitlesCardBases(state),
    highlightedChunkIndex: r.getHighlightedChunkIndex(state),
  }))

  const dispatch = useDispatch()
  const goToSubtitlesChunk = useCallback(
    (trackId: string, chunkIndex: number) => {
      dispatch(r.goToSubtitlesChunk(trackId, chunkIndex))
    },
    [dispatch]
  )

  const { viewBox, cursor, stepsPerSecond } = waveform
  const height =
    WAVEFORM_HEIGHT + subtitles.totalTracksCount * SUBTITLES_CHUNK_HEIGHT
  const viewBoxString = getViewBoxString(viewBox.xMin, height)
  const svgRef = useRef(null)

  const handleMouseDown = useCallback(
    e => {
      const coords = toWaveformCoordinates(
        e,
        e.currentTarget,
        waveform.viewBox.xMin
      )
      const waveformMousedown = new WaveformMousedownEvent(
        e.currentTarget,
        getSecondsAtXFromWaveform(waveform, coords.x)
      )
      document.dispatchEvent(waveformMousedown)
    },
    [waveform]
  )

  const handleClick = useCallback(
    e => {
      const player = document.getElementById('mediaPlayer') as HTMLVideoElement
      if (player) {
        const coords = toWaveformCoordinates(
          e,
          e.currentTarget,
          waveform.viewBox.xMin
        )
        const seconds = getSecondsAtXFromWaveform(waveform, coords.x)
        player.currentTime = seconds

        setCursorX(coords.x)
      }
    },
    [waveform]
  )

  return show ? (
    <svg
      ref={svgRef}
      id="waveform-svg"
      viewBox={viewBoxString}
      preserveAspectRatio="xMinYMin slice"
      className={cn(css.waveformSvg, $.container)}
      width="100%"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      height={height}
    >
      <rect
        fill="#222222"
        x={0}
        y={0}
        width={waveform.length}
        height={height}
      />
      <Clips
        {...{ clips, highlightedClipId, stepsPerSecond, height, waveform }}
      />
      {pendingClip && (
        <PendingClip
          {...pendingClip}
          stepsPerSecond={stepsPerSecond}
          height={height}
        />
      )}
      {pendingStretch && (
        <PendingStretch
          {...pendingStretch}
          stepsPerSecond={stepsPerSecond}
          height={height}
        />
      )}
      {path && (
        <image xlinkHref={`file://${path}`} style={{ pointerEvents: 'none' }} />
      )}

      {Boolean(subtitles.cards.length || subtitles.excludedTracks.length) && (
        <SubtitlesTimelines
          subtitles={subtitles}
          goToSubtitlesChunk={goToSubtitlesChunk}
          highlightedChunkIndex={highlightedChunkIndex}
        />
      )}
      <Cursor x={cursor.x} height={height} />
    </svg>
  ) : (
    <div className={css.waveformPlaceholder} />
  )
}

export default Waveform

export { $ as waveform$ }
