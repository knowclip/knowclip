// @flow
import { getSecondsAtX } from './waveformTime'
import * as audioSelectors from './audio'

export const WAVEFORM_HEIGHT = 50
export const SELECTION_BORDER_WIDTH = 10
export const SELECTION_THRESHOLD = 40

export * from './waveformTime'
export * from './clips'
export * from './audio'
export * from './snackbar'
export * from './dialog'
export * from './noteTypes'
export * from './project'

type ExpandedFlashcard = {
  id: ClipId,
  de: string,
  en: string,
  time: {
    from: number,
    until: number,
  },
}

export const getFlashcard = (
  state: AppState,
  id: ClipId
): ?ExpandedFlashcard => {
  if (!state.clips.byId[id]) return null
  if (!state.clips.byId[id].flashcard) return null
  const flashcard = state.clips.byId[id].flashcard
  const clip = state.clips.byId[id]
  if (!clip) throw new Error('Could not find clip')
  return {
    ...flashcard,
    time: {
      from: getSecondsAtX(state, clip.start),
      until: getSecondsAtX(state, clip.end),
    },
  }
}
export const getCurrentFlashcard = (state: AppState): ?ExpandedFlashcard => {
  const flashcardId = getCurrentFlashcardId(state)
  if (!flashcardId) return null
  return getFlashcard(state, flashcardId)
}

// export const getGerman = (state) => getCurrentFlashcard(state).de
// export const getEnglish = (state) => getCurrentFlashcard(state).en

export const getClip = (state: AppState, id: ClipId): ?Clip =>
  state.clips.byId[id]
export const getClips = (state: AppState): Array<Clip> =>
  audioSelectors.getClipsOrder(state).map(
    (id: ClipId): Clip => {
      const clip = getClip(state, id)
      if (!clip) throw new Error('Impossible')
      return clip
    }
  )
type ExpandedPendingStretch = {
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
}
export const getPendingStretch = (state: AppState): ?ExpandedPendingStretch => {
  if (!state.clips) return
  const { pendingStretch } = state.user
  if (!pendingStretch) return

  const stretchedClip = getClip(state, pendingStretch.id)
  if (!stretchedClip)
    throw new Error('Impossible: no stretched clip ' + pendingStretch.id)

  const { originKey } = pendingStretch
  const [start, end] = [pendingStretch.end, stretchedClip[originKey]].sort()
  return { id: pendingStretch.id, start, end }
}

export const getWaveform = (state: AppState): WaveformState => state.waveform

export const getCurrentFlashcardId = (state: AppState): ?ClipId =>
  state.user.highlightedClipId
export const getFlashcardsByTime = (state: AppState): Array<Flashcard> =>
  audioSelectors.getClipsOrder(state).map(id => {
    const flashcard = getFlashcard(state, id)
    if (!flashcard) throw new Error('flashcard not found ' + id)
    delete flashcard.time
    return flashcard
  })

export const getPendingClip = (state: AppState): ?PendingClip =>
  state.user.pendingClip
export const getClipIdAt = (state: AppState, x: number): ?ClipId =>
  audioSelectors.getClipsOrder(state).find(clipId => {
    const clip = state.clips.byId[clipId]
    const { start, end } = clip
    return x >= start && x <= end
  })

export const getPreviousClipId = (state: AppState, id: ClipId): ?ClipId => {
  const clipsOrder = audioSelectors.getClipsOrder(state)
  return clipsOrder[clipsOrder.indexOf(id) - 1]
}
export const getNextClipId = (state: AppState, id: ClipId): ?ClipId => {
  const clipsOrder = audioSelectors.getClipsOrder(state)
  return clipsOrder[clipsOrder.indexOf(id) + 1]
}

export const getClipEdgeAt = (state: AppState, x: WaveformX) => {
  const clipIdAtX = getClipIdAt(state, x)
  if (!clipIdAtX) return null
  const clip = getClip(state, clipIdAtX)
  if (!clip) throw new Error('Impossible')
  const { start, end } = clip
  if (x >= start && x <= start + SELECTION_BORDER_WIDTH)
    return { key: 'start', id: clipIdAtX }
  if (x >= end - SELECTION_BORDER_WIDTH && x <= end)
    return { key: 'end', id: clipIdAtX }
}

export const getWaveformViewBoxXMin = (state: AppState) =>
  state.waveform.viewBox.xMin

export const getHighlightedClipId = (state: AppState): ?ClipId =>
  state.user.highlightedClipId

type TimeSpan = {
  start: number,
  end: number,
}
export const getClipTimes = (state: AppState, id: ClipId): TimeSpan => {
  const clip = getClip(state, id)
  if (!clip) throw new Error('Maybe impossible')
  return {
    start: getSecondsAtX(state, clip.start),
    end: getSecondsAtX(state, clip.end),
  }
}

export const getClipsTimes = (state: AppState): Array<TimeSpan> =>
  audioSelectors.getClipsOrder(state).map(id => getClipTimes(state, id))

export const isAudioLoading = (state: AppState): boolean =>
  state.audio.isLoading

export const getMediaFolderLocation = (state: AppState): ?string =>
  state.audio.mediaFolderLocation
