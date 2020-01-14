import { basename, extname } from 'path'
import { getFile, getFileAvailabilityById } from './files'
import {
  getFlashcard,
  getClipsObject,
  getClipTimes,
  getClipsByIds,
  getClip,
} from './clips'
import { getHighlightedClipId } from './user'
import { createSelector } from 'reselect'
import { SELECTION_BORDER_WIDTH } from './waveform'

export const isLoopOn = (state: AppState) => state.user.loopMedia

export const getConstantBitrateFilePath = (
  state: AppState,
  id: MediaFileId
): MediaFilePath | null => {
  const fileAvailability = getFileAvailabilityById(state, 'MediaFile', id)
  if (
    fileAvailability &&
    fileAvailability.filePath &&
    extname(fileAvailability.filePath).toLowerCase() !== '.mp3'
  )
    return fileAvailability.status === 'CURRENTLY_LOADED'
      ? fileAvailability.filePath
      : null

  const loadedCbr = getFileAvailabilityById(state, 'ConstantBitrateMp3', id)
  if (loadedCbr && loadedCbr.filePath)
    return loadedCbr.status === 'CURRENTLY_LOADED' ? loadedCbr.filePath : null

  return null
}

export const getCurrentProjectId = (state: AppState): ProjectId | null =>
  state.user.currentProjectId

export const getCurrentProject = (state: AppState): ProjectFile | null => {
  const currentProjectId = getCurrentProjectId(state)
  return currentProjectId
    ? getFile<ProjectFile>(state, 'ProjectFile', currentProjectId)
    : null
}

export const getCurrentFilePath = (state: AppState): MediaFilePath | null => {
  const currentFileId = state.user.currentMediaFileId
  if (!currentFileId) return null

  const currentFile = getFileAvailabilityById(state, 'MediaFile', currentFileId)
  return currentFile && currentFile.status === 'CURRENTLY_LOADED'
    ? currentFile.filePath
    : null
}

export const getCurrentMediaConstantBitrateFilePath = (
  state: AppState
): MediaFilePath | null =>
  state.user.currentMediaFileId
    ? getConstantBitrateFilePath(state, state.user.currentMediaFileId)
    : null

export const getCurrentMediaFile = (state: AppState): MediaFile | null => {
  const { currentMediaFileId } = state.user
  return currentMediaFileId
    ? getFile(state, 'MediaFile', currentMediaFileId)
    : null
}

export const isWorkUnsaved = (state: AppState): boolean =>
  state.user.workIsUnsaved

export const getCurrentFileName = (state: AppState): MediaFileName | null => {
  const filePath = getCurrentFilePath(state)
  return filePath && basename(filePath)
}

export const getCurrentFileId = ({ user }: AppState): MediaFileId | null =>
  user.currentMediaFileId

const empty: Array<ClipId> = []
export const getClipsOrder = (
  state: AppState,
  mediaFileId: MediaFileId
): Array<ClipId> => {
  const clips = state.clips.idsByMediaFileId[mediaFileId]
  return clips || empty
}

export const getCurrentFileClipsOrder = (state: AppState): Array<ClipId> => {
  const currentFileId = getCurrentFileId(state)
  if (!currentFileId) return empty
  return getClipsOrder(state, currentFileId)
}

export const doesFileHaveClips = (
  state: AppState,
  fileId: MediaFileId
): boolean => {
  return Boolean(state.clips.idsByMediaFileId[fileId].length)
}

export const doesCurrentFileHaveClips = (state: AppState): boolean => {
  const currentFileId = getCurrentFileId(state)
  return Boolean(
    currentFileId && state.clips.idsByMediaFileId[currentFileId].length
  )
}

export const getCurrentNoteType = (state: AppState): NoteType | null => {
  const currentProject = getCurrentProject(state)
  return currentProject ? currentProject.noteType : null
}

export const getCurrentProjectMediaFiles = (
  state: AppState
): Array<MediaFile> => {
  const projectMetadata = getCurrentProject(state)
  return projectMetadata
    ? projectMetadata.mediaFileIds.map(
        id => getFile<MediaFile>(state, 'MediaFile', id) as MediaFile
      )
    : []
}

export const getProjectMediaFiles = (
  state: AppState,
  id: ProjectId
): Array<MediaFile> => {
  const project = getFile<ProjectFile>(state, 'ProjectFile', id)

  return project
    ? project.mediaFileIds.map(id => state.files.MediaFile[id])
    : []
}

export const getFlashcardsByTime = (state: AppState): Array<Flashcard> =>
  getCurrentFileClipsOrder(state).map(id => {
    const flashcard = getFlashcard(state, id)
    if (!flashcard) throw new Error('flashcard not found ' + id)
    return flashcard
  })

export const getClipIdAt = (state: AppState, x: number): ClipId | null =>
  getCurrentFileClipsOrder(state).find(clipId => {
    const clip = state.clips.byId[clipId]
    const { start, end } = clip
    return x >= start && x <= end
  }) || null

export const getPreviousClipId = (
  state: AppState,
  id: ClipId
): ClipId | null => {
  const clipsOrder = getCurrentFileClipsOrder(state)
  return clipsOrder[clipsOrder.indexOf(id) - 1]
}
export const getNextClipId = (state: AppState, id: ClipId): ClipId | null => {
  const clipsOrder = getCurrentFileClipsOrder(state)
  return clipsOrder[clipsOrder.indexOf(id) + 1]
}

export const getCurrentFileClips: ((
  state: AppState
) => Array<Clip>) = createSelector(
  getCurrentFileClipsOrder,
  getClipsObject,
  getClipsByIds
)
export const getClipsTimes = (state: AppState): Array<TimeSpan> =>
  getCurrentFileClipsOrder(state).map(id => getClipTimes(state, id))

export const getFlashcardIdBeforeCurrent = (state: AppState): ClipId | null => {
  const flashcardId = getHighlightedClipId(state)
  if (!flashcardId) return null
  return getPreviousClipId(state, flashcardId)
}

export const getFlashcardIdAfterCurrent = (state: AppState): ClipId | null => {
  const flashcardId = getHighlightedClipId(state)
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
