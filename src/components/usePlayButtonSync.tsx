import { useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import r from '../redux'
import {
  startMovingCursor,
  stopMovingCursor,
  setCursorX,
} from '../utils/waveform'
import { usePrevious } from '../utils/usePrevious'

export type PlayButtonSync = ReturnType<typeof usePlayButtonSync>

export function usePlayButtonSync(pixelsPerSecond: number) {
  const playing = useSelector(r.isMediaPlaying)
  const dispatch = useDispatch()
  const playMedia = useCallback(() => {
    startMovingCursor(pixelsPerSecond)
    dispatch(r.playMedia())
  }, [dispatch, pixelsPerSecond])
  const pauseMedia = useCallback(() => {
    stopMovingCursor()
    dispatch(r.pauseMedia())
  }, [dispatch])

  const previousPixelsPerSecond = usePrevious(pixelsPerSecond)
  useEffect(() => {
    if (!playing) return
    if (pixelsPerSecond !== previousPixelsPerSecond) {
      stopMovingCursor()
      startMovingCursor(pixelsPerSecond)
    }
  }, [playing, previousPixelsPerSecond, pixelsPerSecond])

  useEffect(() => {
    const startPlaying = () => {
      playMedia()
    }

    document.addEventListener('play', startPlaying, true)

    return () => document.removeEventListener('play', startPlaying, true)
  }, [playMedia])
  useEffect(() => {
    const stopPlaying = () => pauseMedia()

    document.addEventListener('pause', stopPlaying, true)

    return () => document.removeEventListener('pause', stopPlaying, true)
  }, [pauseMedia])

  const playOrPauseAudio = useCallback(() => {
    const player = document.getElementById('mediaPlayer') as
      | HTMLAudioElement
      | HTMLVideoElement
      | null
    if (!player) return
    player.paused ? player.play() : player.pause()
  }, [])

  useEffect(() => {
    const resetPlayButton = () => {
      pauseMedia()
      setCursorX(0)
    }
    document.addEventListener('loadeddata', resetPlayButton, true)
    return () => document.removeEventListener('loadeddata', resetPlayButton)
  }, [pauseMedia])

  return { playOrPauseAudio, playing }
}
