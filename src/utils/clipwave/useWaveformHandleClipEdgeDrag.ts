import React, { useCallback } from 'react'
import {
  WaveformGestureOf,
  ClipStretch,
  recalculateRegions,
  WaveformInterface,
  getRegionEnd,
} from 'clipwave'
import { actions } from '../../actions'
import { Dispatch } from 'redux'
import { SubtitlesCardBase, SubtitlesCardBases } from '../../selectors'
import {
  STRETCH_START_DELAY,
  getStretchedClipOverlaps,
} from './useWaveformEventHandlers'
import { isWaveformItemSelectable } from './isWaveformItemSelectable'

export function useWaveformHandleClipEdgeDrag(
  cardsBases: SubtitlesCardBases,
  waveform: WaveformInterface,
  dispatch: Dispatch<Action>,
  playerRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>
) {
  const {
    state: { regions },
    getItemDangerously,
  } = waveform
  return useCallback(
    ({
      gesture: stretch,
      mouseDown,
      timeStamp,
    }: WaveformGestureOf<ClipStretch>) => {
      const stretchImminent =
        timeStamp - mouseDown.timeStamp > STRETCH_START_DELAY
      if (!stretchImminent) return

      const unstretchedClip = getItemDangerously(stretch.clipId)
      const stretchedClip = {
        ...unstretchedClip,
        [stretch.originKey]: stretch.end,
      }

      const {
        clips,
        subtitlesFront: allOverlappedFront,
        subtitlesBack: allOverlappedBack,
      } = getStretchedClipOverlaps(
        stretch,
        getItemDangerously,
        stretchedClip,
        cardsBases
      )

      const region = regions[stretch.regionIndex]
      if (!region)
        console.error('region not found for stretch ' + stretchedClip.id)

      const getOverlapStats = (sb: SubtitlesCardBase) => {
        const stretchEndRegionIndex = regions.findIndex(
          (r, i) => sb.start < getRegionEnd(regions, i) && sb.end > r.start
        )
        return {
          subtitlesCardBase: sb,
          isSelectable: isWaveformItemSelectable(
            sb,
            regions[stretchEndRegionIndex],
            stretchEndRegionIndex,
            regions,
            waveform.getItem
          ),
        }
      }
      const subtitlesFront = allOverlappedFront.map(getOverlapStats)
      const subtitlesBack = allOverlappedBack.map(getOverlapStats)

      const overlapIds = clips.map((c) => c.id)

      const newStartWithMerges = Math.min(
        ...[stretchedClip, ...clips].map((i) => i.start)
      )
      const newEndWithMerges = Math.max(
        ...[stretchedClip, ...clips].map((i) => i.end)
      )

      const clipToStretchId = stretch.clipId
      const newItem = {
        ...getItemDangerously(clipToStretchId),
        id: clipToStretchId,
        start: newStartWithMerges,
        end: newEndWithMerges,
      }
      const { regions: newRegions, newSelectionRegion } = recalculateRegions(
        regions,
        getItemDangerously,
        [
          {
            type: 'UPDATE',
            newItem,
          },
          ...overlapIds.map((id) => ({ type: 'DELETE' as const, itemId: id })),
        ],
        newStartWithMerges
      )
      const newSelection = {
        item: clipToStretchId,
        regionIndex: newSelectionRegion,
      }
      waveform.dispatch({
        type: 'SET_REGIONS',
        regions: newRegions,
        newSelectionRegion: newSelection.regionIndex,
        newSelectionItemId: newSelection.item,
      })

      dispatch(
        actions.stretchClip(
          stretchedClip,
          clips,
          unstretchedClip,
          subtitlesFront,
          subtitlesBack,
          newRegions
        )
      )
      if (typeof newSelection.regionIndex === 'number')
        waveform.actions.selectItemAndSeekTo(
          newSelection.regionIndex,
          newSelection.item,
          playerRef.current,
          stretchedClip.start
        )
    },
    [cardsBases, dispatch, getItemDangerously, playerRef, regions, waveform]
  )
}
