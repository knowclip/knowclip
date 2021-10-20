import React, { useCallback } from 'react'
import cn from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import r from '../redux'
import css from './Waveform.module.css'
import {
  msToPixels,
  setCursorX,
  SUBTITLES_CHUNK_HEIGHT,
  useWaveform,
  WAVEFORM_HEIGHT,
} from 'clipwave'
import { $ } from './Waveform'
import { RenderSecondaryClip } from 'clipwave/dist/Waveform'

export const useRenderSecondaryClip = (
  waveform: ReturnType<typeof useWaveform>
) => {
  const subsBases = useSelector(r.getSubtitlesCardBases)
  const { linkedTrackIds, getFieldsPreviewFromCardsBase } = subsBases
  const selection = waveform.getSelection()
  const renderSecondaryClip: RenderSecondaryClip = useCallback(
    ({ clip, region, regionIndex, pixelsPerSecond }) => {
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
      const fieldsPreview = getFieldsPreviewFromCardsBase(cardBase)

      const isSelected = selection.item?.id === clip.id

      return (
        <g
          className={cn(css.subtitlesChunk, $.subtitlesChunk)}
          {...clickDataProps}
        >
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
    },
    [
      getFieldsPreviewFromCardsBase,
      linkedTrackIds,
      subsBases.cardsMap,
      subsBases.linkedTrackIds.length,
      selection,
    ]
  )
  return renderSecondaryClip
}
