import { useCallback } from 'react'
import cn from 'clsx'
import { useDispatch, useSelector } from 'react-redux'
import r from '../redux'
import css from './Waveform.module.css'
import {
  msToPixels,
  SecondaryClipDisplayProps,
  SUBTITLES_CHUNK_HEIGHT,
  WaveformInterface,
  WAVEFORM_HEIGHT,
} from 'clipwave'
import { waveform$ as $ } from './waveformTestLabels'
import { SubtitlesCardBases } from '../selectors'
import { actions } from '../actions'
import { isWaveformItemSelectable } from '../utils/clipwave/isWaveformItemSelectable'
import { getMediaPlayer } from '../utils/media'

export const useWaveformRenderSubtitlesChunk = (
  waveform: WaveformInterface
) => {
  const subsBases = useSelector(r.getSubtitlesCardBases)
  const selection = waveform.getSelection()

  return useCallback(
    (displayProps: SecondaryClipDisplayProps) => (
      <WaveformSubtitlesChunk
        {...{
          ...displayProps,
          subsBases,
          selection,
          selectItemAndSeekTo: waveform.actions.selectItemAndSeekTo,
          isSelectable: isWaveformItemSelectable(
            displayProps.clip,
            displayProps.region,
            displayProps.regionIndex,
            waveform.state.regions,
            waveform.getItem
          ),
        }}
      />
    ),
    [
      selection,
      subsBases,
      waveform.state.regions,
      waveform.getItem,
      waveform.actions.selectItemAndSeekTo,
    ]
  )
}

function WaveformSubtitlesChunk({
  clip,
  regionIndex,
  pixelsPerSecond,
  subsBases,
  selection,
  isSelectable,
  selectItemAndSeekTo,
}: SecondaryClipDisplayProps & {
  subsBases: SubtitlesCardBases
  selection: ReturnType<WaveformInterface['getSelection']>
  isSelectable: boolean
  selectItemAndSeekTo: WaveformInterface['actions']['selectItemAndSeekTo']
}) {
  const isSelected = selection.item?.id === clip.id

  const dispatch = useDispatch()
  const handleDoubleClick = useCallback(() => {
    dispatch(
      actions.newCardFromSubtitlesRequest(
        { type: 'Preview', id: clip.id },
        undefined,
        false
      )
    )
  }, [clip.id, dispatch])

  const handleClick = useCallback(() => {
    if (!isSelected)
      selectItemAndSeekTo(regionIndex, clip.id, getMediaPlayer(), clip.start)
  }, [clip.id, clip.start, isSelected, regionIndex, selectItemAndSeekTo])

  const cardBase = subsBases.cardsMap[clip.id]
  if (!cardBase) return null
  const clipPathId = `subs__${clip.id}`
  const displayStart = msToPixels(cardBase.start, pixelsPerSecond)
  const displayEnd = msToPixels(cardBase.end, pixelsPerSecond)
  const width = displayEnd - displayStart

  const rect = {
    x: displayStart,
    y: WAVEFORM_HEIGHT,
    width: width,
    height: SUBTITLES_CHUNK_HEIGHT * subsBases.linkedTrackIds.length,
  }
  const clickDataProps = {}
  const fieldsPreview = subsBases.getFieldsPreviewFromCardsBase(cardBase)

  return (
    <g
      className={cn(css.subtitlesChunk, $.subtitlesChunk, {
        [css.unselectable]: !isSelectable,
      })}
      {...clickDataProps}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
    >
      <clipPath id={clipPathId}>
        <rect {...rect} width={Math.max(0, width - 10)} />
      </clipPath>
      <rect
        className={cn(css.subtitlesChunkRectangle, {
          [css.selectedSubtitlesChunk]: isSelected,
        })}
        {...clickDataProps}
        {...rect}
        rx={SUBTITLES_CHUNK_HEIGHT / 2}
      />
      {subsBases.linkedTrackIds.map((id, i) => {
        const i1 = 1 + i
        return (
          <text
            key={id + i}
            clipPath={`url(#${clipPathId})`}
            className={css.subtitlesText}
            x={displayStart + 6}
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
