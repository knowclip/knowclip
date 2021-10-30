import React, { useCallback } from 'react'
import {
  WaveformGestureOf,
  ClipDrag,
  msToSeconds,
  recalculateRegions,
  secondsToMs,
  WaveformInterface,
} from 'clipwave'
import { actions } from '../../actions'
import { bound } from '../bound'
import { setCurrentTime } from '../media'
import { Dispatch } from 'redux'

export function useHandleWaveformClipDrag(
  playerRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>,
  dispatch: Dispatch<Action>,
  waveform: WaveformInterface,
  highlightedClipId: string | null
) {
  const {
    getItemDangerously,
    actions: waveformActions,
    state: { regions, durationSeconds },
  } = waveform

  const MOVE_START_DELAY = 400
  return useCallback(
    ({ gesture: move, mouseDown, timeStamp }: WaveformGestureOf<ClipDrag>) => {
      const moveImminent = timeStamp - mouseDown.timeStamp >= MOVE_START_DELAY
      if (moveImminent) {
        const deltaX = move.end - move.start

        const clipToMove = getItemDangerously(move.clipId)

        const offsetStart = clipToMove.start + deltaX
        const offsetEnd = clipToMove.end + deltaX

        const clipToMoveId = clipToMove.id

        const overlaps = move.overlaps.flatMap((id) => {
          const item = getItemDangerously(id)
          const { start, end } = item
          return item.clipwaveType === 'Primary' &&
            start <= offsetEnd &&
            end >= offsetStart
            ? [item]
            : []
        })
        const overlapIds = overlaps.map((c) => c.id)

        setCurrentTime(
          msToSeconds(Math.min(offsetStart, ...overlaps.map((c) => c.start)))
        )

        const toMerge = [
          { id: clipToMoveId, start: offsetStart, end: offsetEnd },
          ...overlaps,
        ].sort((a, b) => a.start - b.start)

        const newStartWithMerges = Math.min(...toMerge.map((c) => c.start))
        const newEndWithMerges = Math.max(...toMerge.map((c) => c.end))

        const { regions: newRegions } = recalculateRegions(
          regions,
          getItemDangerously,
          [
            {
              type: 'UPDATE',
              newItem: {
                ...getItemDangerously(clipToMoveId),
                id: clipToMoveId,
                start: newStartWithMerges,
                end: newEndWithMerges,
              },
            },
            ...overlapIds.map((id) => ({
              itemId: id,
              type: 'DELETE' as const,
            })),
          ]
        )

        const newSelectionRegion = newRegions.findIndex(
          (r) =>
            r.start >= newStartWithMerges &&
            (r.end ?? secondsToMs(durationSeconds)) < newEndWithMerges
        )
        waveform.dispatch({
          type: 'SET_REGIONS',
          regions: newRegions,
          newSelectionRegion,
          newSelectionItemId: clipToMoveId,
        })
        // TODO: investigate making sure this happens in clipwave
        waveform.actions.selectItem(newSelectionRegion, clipToMoveId)
        dispatch(actions.moveClip(clipToMoveId, deltaX, overlapIds, newRegions))

        return
      }

      const { regionIndex, start, end } = move
      const deltaX = end - start
      const { clipId } = move

      const clipToDrag = getItemDangerously(clipId)
      const isHighlighted = clipToDrag.id === highlightedClipId

      const draggedClipStart = moveImminent
        ? clipToDrag.start + deltaX
        : clipToDrag.start
      const newTimeSeconds =
        !isHighlighted || moveImminent
          ? bound(msToSeconds(draggedClipStart), [
              0,
              waveform.state.durationSeconds,
            ])
          : msToSeconds(end)
      waveformActions.selectItemAndSeekTo(
        regionIndex,
        clipId,
        playerRef.current,
        secondsToMs(newTimeSeconds)
      )
    },
    [
      getItemDangerously,
      highlightedClipId,
      waveform,
      waveformActions,
      playerRef,
      regions,
      dispatch,
      durationSeconds,
    ]
  )
}
