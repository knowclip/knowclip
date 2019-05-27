// @flow
import { createSelector } from 'reselect'
import { getSecondsAtX } from './waveformTime'
import * as audioSelectors from './audio'
import formatTime from '../utils/formatTime'

export const WAVEFORM_HEIGHT = 50
export const SELECTION_BORDER_WIDTH = 10
export const CLIP_THRESHOLD = 40

export * from './waveformTime'
export * from './clips'
export * from './audio'
export * from './snackbar'
export * from './dialog'
export * from './project'
export * from './subtitles'

export const getClip = (state: AppState, id: ClipId): ?Clip =>
  state.clips.byId[id]

export const getClipsObject = (state: AppState): { [ClipId]: Clip } =>
  state.clips.byId

const getClipsByIds = (
  clipsOrder: Array<ClipId>,
  clips: { [ClipId]: Clip }
): Array<Clip> =>
  clipsOrder.map(id => {
    const clip = clips[id]
    if (!clip) throw new Error('Could not find clip')
    return clip
  })

export const getClips = (
  state: AppState,
  mediaFileId: MediaFileId
): Array<Clip> => {
  const clipsOrder = state.clips.idsByMediaFileId[mediaFileId]
  return clipsOrder ? getClipsByIds(clipsOrder, getClipsObject(state)) : []
}

export const getAllProjectClipsIds: (
  state: AppState
) => Array<ClipId> = createSelector(
  getClipsObject,
  clipsObject => Object.keys(clipsObject)
)

export const getCurrentFileClips: (
  state: AppState
) => Array<Clip> = createSelector(
  audioSelectors.getCurrentFileClipsOrder,
  getClipsObject,
  getClipsByIds
)

type TimeSpan = {
  start: number,
  end: number,
}

export const getClipTime = (state: AppState, id: ClipId): ?TimeSpan => {
  const clip = getClip(state, id)
  if (!clip) return null

  return {
    start: getSecondsAtX(state, clip.start),
    end: getSecondsAtX(state, clip.end),
  }
}

export const getFormattedClipTime = (state: AppState, id: ClipId): ?string => {
  const clipTime = getClipTime(state, id)
  if (!clipTime) return null

  return `${formatTime(clipTime.start)} - ${formatTime(clipTime.end)}`
}

export const getFlashcard = (state: AppState, id: ClipId): ?Flashcard => {
  const clip = getClip(state, id)
  if (!clip) return null
  // if (!clip.flashcard) return null
  const flashcard = clip.flashcard
  if (!clip) throw new Error('Could not find clip')
  return flashcard
}
export const getCurrentFlashcard = (state: AppState): ?Flashcard => {
  const flashcardId = getSelectedClipId(state)
  if (!flashcardId) return null
  return getFlashcard(state, flashcardId)
}

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

export const getSelectedClipId = (state: AppState): ?ClipId =>
  state.user.highlightedClipId

export const getSelectedClipTime = (state: AppState): ?TimeSpan => {
  const clipId = getSelectedClipId(state)
  return clipId ? getClipTime(state, clipId) : null
}

export const getFlashcardsByTime = (state: AppState): Array<Flashcard> =>
  audioSelectors.getCurrentFileClipsOrder(state).map(id => {
    const flashcard = getFlashcard(state, id)
    if (!flashcard) throw new Error('flashcard not found ' + id)
    return flashcard
  })

export const getPendingClip = (state: AppState): ?PendingClip =>
  state.user.pendingClip
export const getClipIdAt = (state: AppState, x: number): ?ClipId =>
  audioSelectors.getCurrentFileClipsOrder(state).find(clipId => {
    const clip = state.clips.byId[clipId]
    const { start, end } = clip
    return x >= start && x <= end
  })

export const getPreviousClipId = (state: AppState, id: ClipId): ?ClipId => {
  const clipsOrder = audioSelectors.getCurrentFileClipsOrder(state)
  return clipsOrder[clipsOrder.indexOf(id) - 1]
}
export const getNextClipId = (state: AppState, id: ClipId): ?ClipId => {
  const clipsOrder = audioSelectors.getCurrentFileClipsOrder(state)
  return clipsOrder[clipsOrder.indexOf(id) + 1]
}

export const getFlashcardIdBeforeCurrent = (state: AppState): ?FlashcardId => {
  const flashcardId = getSelectedClipId(state)
  if (!flashcardId) return null
  return getPreviousClipId(state, flashcardId)
}

export const getFlashcardIdAfterCurrent = (state: AppState): ?FlashcardId => {
  const flashcardId = getSelectedClipId(state)
  if (!flashcardId) return null
  return getNextClipId(state, flashcardId)
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

export const getHighlightedClip = (state: AppState): ?Clip => {
  const highlightedClipId = getHighlightedClipId(state)
  return highlightedClipId ? getClip(state, highlightedClipId) : null
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
  audioSelectors
    .getCurrentFileClipsOrder(state)
    .map(id => getClipTimes(state, id))

export const isAudioLoading = (state: AppState): boolean =>
  state.audio.isLoading

export const getMediaFolderLocation = (state: AppState): ?string =>
  state.audio.mediaFolderLocation

export const getAllTags = (state: AppState): Array<string> => {
  const tags: any = Object.keys(state.user.tagsToClipIds)
  return (tags: Array<Array<string>>).reduce((a, b) => a.concat(b), [])
}
