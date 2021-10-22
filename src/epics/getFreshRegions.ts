import {
  calculateRegions,
  getNewWaveformSelectionAt,
  secondsToMs,
  sortWaveformItems,
  WaveformInterface,
} from 'clipwave'
import { SubtitlesCardBases } from '../selectors'

export function getFreshRegions(
  currentFileClipsOrder: string[],
  clipsMap: Record<string, Clip>,
  subsBases: SubtitlesCardBases,
  waveform: WaveformInterface,
  mediaPlayer: HTMLVideoElement | HTMLAudioElement | null
) {
  const sortedItems = sortWaveformItems([
    ...currentFileClipsOrder.map((id) => clipsMap[id]),
    ...subsBases.cards,
  ])
  const { regions } = calculateRegions(
    sortedItems,
    secondsToMs(waveform.state.durationSeconds)
  )
  return {
    regions,
    newSelection: getNewWaveformSelectionAt(
      waveform.getItem,
      regions,
      secondsToMs(mediaPlayer?.currentTime || 0),
      waveform.getSelection().selection
    ),
  }
}
