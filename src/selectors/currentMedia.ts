import {
  getFile,
  getFileAvailabilityById,
  getFileAvailability,
  convertedFilePlaylistByIdUrl,
  fileByIdUrl,
} from './files'
import { getFlashcard, getClipsObject, getClipsByIds, getClip } from './clips'
import { getHighlightedClipId } from './session'
import { basename } from '../utils/rendererPathHelpers'
import { createSelector } from 'reselect'
import { SELECTION_BORDER_MILLISECONDS } from 'clipwave'
import {
  getMediaCompatibilityIssues,
  getMediaCompatibilityWarnings,
} from '../node/getMediaCompatibilityIssues'

export const getLoopState = (state: AppState) => state.session.loopMedia

export const getLoadedMediaFilePath = (
  state: AppState,
  id: MediaFileId
): MediaFilePath | null => {
  const fileAvailability = getFileAvailabilityById(state, 'MediaFile', id)
  if (
    fileAvailability.filePath &&
    fileAvailability.status === 'CURRENTLY_LOADED'
  )
    return fileAvailability.filePath

  return null
}

export const getCurrentProjectId = (state: AppState): ProjectId | null =>
  state.session.currentProjectId

export const getCurrentProject = (state: AppState): ProjectFile | null => {
  const currentProjectId = getCurrentProjectId(state)
  return currentProjectId
    ? getFile<ProjectFile>(state, 'ProjectFile', currentProjectId)
    : null
}

export const getCurrentFilePath = (state: AppState): MediaFilePath | null => {
  const currentFileId = state.session.currentMediaFileId
  if (!currentFileId) return null

  const currentFile = getFileAvailabilityById(state, 'MediaFile', currentFileId)
  return currentFile?.status === 'CURRENTLY_LOADED'
    ? currentFile.filePath
    : null
}

export const getCurrentMediaFile = (state: AppState): MediaFile | null => {
  const { currentMediaFileId } = state.session
  return currentMediaFileId
    ? getFile(state, 'MediaFile', currentMediaFileId)
    : null
}
export const getCurrentMediaFileMetadata = (state: AppState) => {
  return state.session.currentMediaFileMetadata
}

export const getCurrentMediaFileCompatibilityWarnings = (state: AppState) => {
  return state.session.currentMediaFileMetadata
    ? getMediaCompatibilityWarnings(state.session.currentMediaFileMetadata)
    : []
}

const getCurrentMediaFileCompatibilityIssues = (state: AppState) => {
  return state.session.currentMediaFileMetadata
    ? getMediaCompatibilityIssues(state.session.currentMediaFileMetadata)
        ?.issues
    : null
}

export const getCurrentMediaUrl = createSelector(
  getCurrentMediaFile,
  getCurrentMediaFileCompatibilityIssues,
  (state: AppState) => state.session.localServerAddress,
  (
    currentMediaFile,
    compatibilityIssues,
    localServerAddress
  ): MediaFilePath | null => {
    if (!currentMediaFile) return null
    // mp3s may have trouble with seeking due to variable bit rate
    // so we always transcode them
    if (currentMediaFile.format === 'mp3')
      return convertedFilePlaylistByIdUrl(
        localServerAddress,
        currentMediaFile.id
      )
    return compatibilityIssues?.size
      ? convertedFilePlaylistByIdUrl(localServerAddress, currentMediaFile.id)
      : fileByIdUrl(localServerAddress, currentMediaFile.id)
  }
)

export const isMediaFileLoaded = (state: AppState): boolean => {
  const currentFile = getCurrentMediaFile(state)
  if (!currentFile) return false
  const availability = getFileAvailability(state, currentFile)
  return availability.status === 'CURRENTLY_LOADED'
}

export const isMediaEffectivelyLoading = (state: AppState): boolean => {
  const currentFile = getCurrentMediaFile(state)
  if (!currentFile) return false
  const availability = getFileAvailability(state, currentFile)
  return availability.isLoading
}

export const isWorkUnsaved = (state: AppState): boolean =>
  state.session.workIsUnsaved

export const getCurrentFileName = (state: AppState): MediaFileName | null => {
  const { platform } = window.electronApi
  const filePath = getCurrentFilePath(state)
  return filePath && basename(platform, filePath)
}

export const getCurrentFileId = ({ session }: AppState): MediaFileId | null =>
  session.currentMediaFileId

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
    ? projectMetadata.mediaFileIds
        .map((id) => getFile<MediaFile>(state, 'MediaFile', id))
        .filter((media): media is MediaFile => Boolean(media))
    : []
}

export const getProjectMediaFiles = (
  state: AppState,
  id: ProjectId
): Array<MediaFile> => {
  const project = getFile<ProjectFile>(state, 'ProjectFile', id)

  return project
    ? project.mediaFileIds
        .map((id) => state.files.MediaFile[id])
        .filter((m): m is MediaFile => Boolean(m))
    : []
}

export const getFlashcardsByTime = (state: AppState): Array<Flashcard> =>
  getCurrentFileClipsOrder(state).map((id) => {
    const flashcard = getFlashcard(state, id)
    if (!flashcard) throw new Error('flashcard not found ' + id)
    return flashcard
  })

export const getClipIdAt = (state: AppState, ms: number): ClipId | null =>
  getCurrentFileClipsOrder(state).find((clipId) => {
    const clip = state.clips.byId[clipId]
    const { start, end } = clip
    return ms >= start && ms <= end
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

export const getCurrentFileClips = createSelector(
  getCurrentFileClipsOrder,
  getClipsObject,
  getClipsByIds
)

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
  milliseconds: number
): { key: 'start' | 'end'; id: ClipId } | null => {
  const clipIdAtMs = getClipIdAt(state, milliseconds)
  if (!clipIdAtMs) return null
  const clip = getClip(state, clipIdAtMs)
  if (!clip) throw new Error('Impossible')
  const { start, end } = clip
  if (
    milliseconds >= start &&
    milliseconds <= start + SELECTION_BORDER_MILLISECONDS
  )
    return { key: 'start', id: clipIdAtMs }
  if (
    milliseconds >= end - SELECTION_BORDER_MILLISECONDS &&
    milliseconds <= end
  )
    return { key: 'end', id: clipIdAtMs }

  return null
}
