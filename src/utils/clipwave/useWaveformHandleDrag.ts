import React, { useCallback } from 'react'
import {
  WaveformGestureOf,
  msToSeconds,
  WaveformDrag,
  CLIP_THRESHOLD_MILLSECONDS,
  WaveformInterface,
} from 'clipwave'
import { actions } from '../../actions'
import { Dispatch } from 'redux'

export function useHandleWaveformDrag(
  playerRef: React.MutableRefObject<HTMLVideoElement | HTMLAudioElement | null>,
  dispatch: Dispatch<Action>,
  waveform: WaveformInterface
) {
  const { getItemDangerously } = waveform
  return useCallback(
    ({ gesture }: WaveformGestureOf<WaveformDrag>) => {
      const { start: startRaw, end: endRaw, overlaps } = gesture
      const left = Math.min(startRaw, endRaw)
      const right = Math.max(startRaw, endRaw)

      const tooSmallOrClipOverlapsExist =
        right - left < CLIP_THRESHOLD_MILLSECONDS ||
        overlaps.some((id) => getItemDangerously(id).clipwaveType === 'Primary')
      if (tooSmallOrClipOverlapsExist) {
        if (playerRef.current) {
          playerRef.current.currentTime = msToSeconds(endRaw)
        }
        return
      }

      dispatch(actions.addClipRequest(gesture, newId))

      if (playerRef.current) {
        playerRef.current.currentTime = msToSeconds(left)
      }
    },
    [dispatch, getItemDangerously, playerRef]
  )
}
