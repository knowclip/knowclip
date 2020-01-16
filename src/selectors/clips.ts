import { getMillisecondsAtX, getSecondsAtX } from './waveformTime'
import { createSelector } from 'reselect'
import formatTime from '../utils/formatTime'

export const getClip = (state: AppState, id: ClipId): Clip | null =>
  state.clips.byId[id]

export const getClipsObject = (state: AppState): Record<ClipId, Clip> =>
  state.clips.byId

export const getClipsByIds = (
  clipsOrder: Array<ClipId>,
  clips: Record<ClipId, Clip>
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

export const getAllProjectClipsIds: ((
  state: AppState
) => Array<ClipId>) = createSelector(
  getClipsObject,
  clipsObject => Object.keys(clipsObject)
)

export const getClipTime = (state: AppState, id: ClipId): TimeSpan | null => {
  const clip = getClip(state, id)
  if (!clip) return null

  return {
    start: getSecondsAtX(state, clip.start),
    end: getSecondsAtX(state, clip.end),
  }
}

export const getClipTimes = (state: AppState, id: ClipId): TimeSpan => {
  const clip = getClip(state, id)
  if (!clip) throw new Error('Maybe impossible')
  return {
    start: getSecondsAtX(state, clip.start),
    end: getSecondsAtX(state, clip.end),
  }
}

export const getFormattedClipTime = (
  state: AppState,
  id: ClipId
): string | null => {
  const clipTime = getClipTime(state, id)
  if (!clipTime) return null

  return `${formatTime(clipTime.start)} - ${formatTime(clipTime.end)}`
}

export const getFlashcard = (state: AppState, id: ClipId): Flashcard | null => {
  const clip = getClip(state, id)
  if (!clip) return null
  // if (!clip.flashcard) return null
  const flashcard = clip.flashcard
  if (!clip) throw new Error('Could not find clip')
  return flashcard
}

export const getClipMilliseconds = (
  state: AppState,
  id: ClipId
): {
  start: number
  end: number
} => {
  const clip = state.clips.byId[id]
  if (!clip) throw new Error('Maybe impossible')
  return {
    start: getMillisecondsAtX(state, clip.start),
    end: getMillisecondsAtX(state, clip.end),
  }
}

export const getClipIdsByMediaFileId = (
  state: AppState,
  mediaFileId: string
): Array<ClipId> => state.clips.idsByMediaFileId[mediaFileId]
