import { createSelector } from 'reselect'
import { getSecondsAtX } from './waveformTime'
import * as mediaSelectors from './media'
import * as projectSelectors from './media'
import formatTime from '../utils/formatTime'
import getAllTagsFromClips from '../utils/getAllTags'
// import { getClips } from '.'

import { getSourceSubtitlesFile } from './subtitles'
import moment from 'moment'

export const WAVEFORM_HEIGHT = 50
export const SELECTION_BORDER_WIDTH = 5
export const CLIP_THRESHOLD = 40

export * from './waveformTime'
export * from './clips'
export * from './media'
export * from './snackbar'
export * from './dialog'
export * from './project'
export * from './subtitles'
export * from './files'

export const getClip = (state: AppState, id: ClipId): Clip | null =>
  state.clips.byId[id]

export const getClipsObject = (state: AppState): Record<ClipId, Clip> =>
  state.clips.byId

const getClipsByIds = (
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

export const getCurrentFileClips: ((
  state: AppState
) => Array<Clip>) = createSelector(
  mediaSelectors.getCurrentFileClipsOrder,
  getClipsObject,
  getClipsByIds
)

type TimeSpan = {
  start: number
  end: number
}

export const getClipTime = (state: AppState, id: ClipId): TimeSpan | null => {
  const clip = getClip(state, id)
  if (!clip) return null

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
export const getCurrentFlashcard = (state: AppState): Flashcard | null => {
  const flashcardId = getSelectedClipId(state)
  if (!flashcardId) return null
  return getFlashcard(state, flashcardId)
}

type ExpandedPendingStretch = {
  id: ClipId
  start: WaveformX
  end: WaveformX
}

export const getPendingStretch = (
  state: AppState
): ExpandedPendingStretch | null => {
  if (!state.clips) return null
  const { pendingStretch } = state.user
  if (!pendingStretch) return null

  const stretchedClip = getClip(state, pendingStretch.id)
  if (!stretchedClip)
    throw new Error('Impossible: no stretched clip ' + pendingStretch.id)

  const { originKey } = pendingStretch
  const [start, end] = [pendingStretch.end, stretchedClip[originKey]].sort()
  return { id: pendingStretch.id, start, end }
}

export const getWaveform = (state: AppState): WaveformState => state.waveform

export const getSelectedClipId = (state: AppState): ClipId | null =>
  state.user.highlightedClipId

export const getSelectedClipTime = (state: AppState): TimeSpan | null => {
  const clipId = getSelectedClipId(state)
  return clipId ? getClipTime(state, clipId) : null
}

export const getFlashcardsByTime = (state: AppState): Array<Flashcard> =>
  mediaSelectors.getCurrentFileClipsOrder(state).map(id => {
    const flashcard = getFlashcard(state, id)
    if (!flashcard) throw new Error('flashcard not found ' + id)
    return flashcard
  })

export const getPendingClip = (state: AppState): PendingClip | null =>
  state.user.pendingClip
export const getClipIdAt = (state: AppState, x: number): ClipId | null =>
  mediaSelectors.getCurrentFileClipsOrder(state).find(clipId => {
    const clip = state.clips.byId[clipId]
    const { start, end } = clip
    return x >= start && x <= end
  }) || null

export const getPreviousClipId = (
  state: AppState,
  id: ClipId
): ClipId | null => {
  const clipsOrder = mediaSelectors.getCurrentFileClipsOrder(state)
  return clipsOrder[clipsOrder.indexOf(id) - 1]
}
export const getNextClipId = (state: AppState, id: ClipId): ClipId | null => {
  const clipsOrder = mediaSelectors.getCurrentFileClipsOrder(state)
  return clipsOrder[clipsOrder.indexOf(id) + 1]
}

export const getFlashcardIdBeforeCurrent = (state: AppState): ClipId | null => {
  const flashcardId = getSelectedClipId(state)
  if (!flashcardId) return null
  return getPreviousClipId(state, flashcardId)
}

export const getFlashcardIdAfterCurrent = (state: AppState): ClipId | null => {
  const flashcardId = getSelectedClipId(state)
  if (!flashcardId) return null
  return getNextClipId(state, flashcardId)
}

export const getClipEdgeAt = (
  state: AppState,
  x: WaveformX
): { key: 'start' | 'end'; id: ClipId } | null => {
  const clipIdAtX = getClipIdAt(state, x)
  if (!clipIdAtX) return null
  const clip = getClip(state, clipIdAtX)
  if (!clip) throw new Error('Impossible')
  const { start, end } = clip
  if (x >= start && x <= start + SELECTION_BORDER_WIDTH)
    return { key: 'start', id: clipIdAtX }
  if (x >= end - SELECTION_BORDER_WIDTH && x <= end)
    return { key: 'end', id: clipIdAtX }

  return null
}

export const getWaveformViewBoxXMin = (state: AppState) =>
  state.waveform.viewBox.xMin

export const getHighlightedClipId = (state: AppState): ClipId | null =>
  state.user.highlightedClipId

export const getHighlightedClip = (state: AppState): Clip | null => {
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
  mediaSelectors
    .getCurrentFileClipsOrder(state)
    .map(id => getClipTimes(state, id))

export const isAudioLoading = (state: AppState): boolean =>
  state.user.mediaIsLoading

export const getMediaFolderLocation = (state: AppState): string | null =>
  state.settings.mediaFolderLocation

export const getAllTags = (state: AppState): Array<string> => {
  const tags = Object.keys(state.user.tagsToClipIds)
  return tags.reduce((a, b) => a.concat(b), [] as Array<string>)
}

export const getProject = (
  state: AppState,
  file: ProjectFile
): Project4_1_0 => {
  const mediaFiles = mediaSelectors.getProjectMediaFiles(state, file.id)
  return {
    version: '4.1.0',
    timestamp: moment.utc().format(),
    name: file.name,
    id: file.id,
    noteType: file.noteType,
    lastOpened: file.lastOpened,
    mediaFiles,
    tags: [...getAllTagsFromClips(state.clips.byId)],
    clips: mediaFiles.reduce(
      (clips, { id }) => [...clips, ...getClips(state, id)],
      [] as Clip[]
    ),
    subtitles: mediaFiles.reduce(
      (subtitlesFiles, { id, subtitles }) => [
        ...subtitlesFiles,
        ...subtitles
          .map(id => getSourceSubtitlesFile(state, id))
          .filter(
            (file): file is ExternalSubtitlesFile =>
              Boolean(file && file.type === 'ExternalSubtitlesFile')
          ),
      ],
      [] as ExternalSubtitlesFile[]
    ),
  }
}
