import React, { memo, useRef, useCallback, useMemo, EventHandler } from 'react'
import cn from 'classnames'
import { useSelector, useDispatch } from 'react-redux'
import r from '../redux'
import css from './Waveform.module.css'
import {
  toWaveformCoordinates,
  getSecondsAtXFromWaveform,
} from '../utils/waveformCoordinates'
import WaveformMousedownEvent from '../utils/WaveformMousedownEvent'
import { setCursorX } from '../utils/waveform'
import {
  ExpandedPendingStretch,
  SubtitlesCardBase,
  SubtitlesCardBases,
  WaveformSelectionExpanded,
} from '../selectors'

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
const Clip = React.memo(
  ({ id, start, end, isHighlighted, height, index }: ClipProps) => {
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
)

type ChunkProps = {
  start: number
  end: number
  stepsPerSecond: number
  height: number
}

const WAVEFORM_ACTION_TYPE_TO_CLASSNAMES: Record<
  PendingWaveformAction['type'],
  string
> = {
  PendingClip: css.waveformPendingClip,
  PendingClipMove: css.waveformPendingClipMove,
  PendingStretch: css.waveformPendingStretch,
}

type WaveformPendingAction = Exclude<
  ReturnType<typeof r.getPendingWaveformAction>,
  null
>
const PendingWaveformItem = ({
  start,
  end,
  height,
  type,
}: ChunkProps & Pick<WaveformPendingAction, 'type'>) => (
  <rect
    className={WAVEFORM_ACTION_TYPE_TO_CLASSNAMES[type]}
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
      (e) => {
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
          }
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
      },
      [clips, waveform]
    )

    return (
      <g className={$.waveformClipsContainer} onClick={handleClick}>
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

const SubtitlesTimelines = memo(
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

const Waveform = () => {
  const {
    waveform,
    images,
    clips,
    pendingWaveformAction,
    highlightedClipId,
    subtitles,
    highlightedChunkIndex,
    waveformItems,
    mediaIsLoaded,
  } = useSelector((state: AppState) => ({
    waveform: r.getWaveform(state),
    images: r.getWaveformImages(state),
    clips: r.getCurrentFileClips(state),
    pendingWaveformAction: r.getPendingWaveformAction(state) as
      | PendingClip
      | ExpandedPendingStretch
      | PendingClipMove
      | null,
    highlightedClipId: r.getHighlightedClipId(state),
    subtitles: r.getDisplayedSubtitlesCardBases(state),
    highlightedChunkIndex: r.getHighlightedChunkIndex(state),
    waveformItems: r.getDisplayedWaveformItems(state),
    mediaIsLoaded: r.isMediaFileLoaded(state),
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
  const svgRef = useRef<SVGSVGElement>(null)

  const handleMouseUp = useCallback(
    (e) => {
      const svg = svgRef.current
      if (!svg) return

      const coords = toWaveformCoordinates(e, svg, waveform.viewBox.xMin)
      const x = Math.min(waveform.length, coords.x)
      const { dataset } = e.target

      if (
        dataset &&
        ((dataset.clipId && !dataset.clipIsHighlighted) || dataset.chunkIndex)
      ) {
        return
      }

      const player = document.getElementById('mediaPlayer') as HTMLVideoElement
      if (player) {
        const seconds = getSecondsAtXFromWaveform(waveform, x)
        player.currentTime = seconds

        setCursorX(x)
      }
    },
    [waveform]
  )

  const handleMouseDown: EventHandler<React.MouseEvent<
    SVGElement
  >> = useCallback(
    (e) => {
      const coords = toWaveformCoordinates(
        e,
        e.currentTarget,
        waveform.viewBox.xMin
      )
      const x = Math.min(waveform.length, coords.x)
      const waveformMousedown = new WaveformMousedownEvent(
        e,
        getSecondsAtXFromWaveform(waveform, x)
      )
      document.dispatchEvent(waveformMousedown)

      const handleNextMouseUp = (e: MouseEvent) => {
        handleMouseUp(e)
        document.removeEventListener('mouseup', handleNextMouseUp)
      }
      document.addEventListener('mouseup', handleNextMouseUp)
    },
    [waveform, handleMouseUp]
  )

  const imageBitmaps = useMemo(() => {
    return images.map(({ path, x, file }) => (
      <image
        key={file.id}
        xlinkHref={new URL(`file://${path}`).toString()}
        style={{ pointerEvents: 'none' }}
        x={x}
      />
    ))
  }, [images])

  return (
    <svg
      ref={svgRef}
      id="waveform-svg"
      viewBox={viewBoxString}
      preserveAspectRatio="xMinYMin slice"
      className={cn(css.waveformSvg, $.container)}
      width="100%"
      onMouseDown={handleMouseDown}
      height={height}
      style={mediaIsLoaded ? undefined : { pointerEvents: 'none' }}
    >
      <g>
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
        {pendingWaveformAction && (
          <PendingWaveformItem
            {...pendingWaveformAction}
            type={pendingWaveformAction.type}
            stepsPerSecond={stepsPerSecond}
            height={height}
          />
        )}
        {imageBitmaps}

        {Boolean(subtitles.cards.length || subtitles.excludedTracks.length) && (
          <SubtitlesTimelines
            subtitles={subtitles}
            goToSubtitlesChunk={goToSubtitlesChunk}
            highlightedChunkIndex={highlightedChunkIndex}
            waveformItems={waveformItems}
          />
        )}
        <Cursor x={cursor.x} height={height} />
      </g>
    </svg>
  )
}

export default Waveform

export { $ as waveform$ }
