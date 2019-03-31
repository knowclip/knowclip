// @flow
import { basename } from 'path'
import { getCurrentFilePath, getProjectMetadata } from './project'

// export const getFilePaths = (state: AppState) => state.audio.filesOrder
export const isLoopOn = (state: AppState) => state.audio.loop
// export const areFilesLoaded = (state: AppState) =>
//   Boolean(state.audio.filesOrder.length)
// export const isNextButtonEnabled = (state: AppState) =>
//   Boolean(state.audio.filesOrder.length > 1) &&
//   state.audio.currentFileIndex !== state.audio.filesOrder.length - 1
// export const isPrevButtonEnabled = (state: AppState) =>
//   Boolean(state.audio.filesOrder.length > 1) &&
//   state.audio.currentFileIndex !== 0
// export const getCurrentFileIndex = (state: AppState) =>
//   state.audio.currentFileIndex
export const getCurrentFileName = (state: AppState): ?MediaFileName => {
  const filePath = getCurrentFilePath(state)
  return filePath && basename(filePath)
}

// export const getMediaFile = (
//   state: AppState,
//   id: MediaFileId
// ): ?MediaFileData => {

//   const file = state.audio.files[id]
//   return file || null
// }

// export const getMediaFilePath = (
//   state: AppState,
//   id: MediaFileId
// ): ?MediaFilePath => {
//   const file = getMediaFile(state, id)
//   return file ? file.path : null
// }

export const getCurrentFileId = ({ user }: AppState): ?MediaFileId =>
  // audio.filesOrder[audio.currentFileIndex]
  user.currentMediaFileId

// export const getCurrentFile = (state: AppState): ?MediaFileData => {
//   const currentFileId = getCurrentFileId(state)
//   return currentFileId ? state.audio.files[currentFileId] : null
// }
// export const getCurrentFilePath = (state: AppState): ?MediaFilePath => {
//   const currentFile = getCurrentFile(state)
//   return currentFile ? currentFile.path : null
// }
const empty: [] = Object.freeze([])
export const getClipsOrder = (state: AppState): Array<ClipId> | [] => {
  const currentFileId = getCurrentFileId(state)
  if (!currentFileId) return empty
  const clips = state.clips.idsByMediaFileId[currentFileId]
  return clips || empty
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

export const getCurrentNoteType = (state: AppState): ?NoteType => {
  const { currentNoteTypeId } = state.user
  return currentNoteTypeId ? state.noteTypes.byId[currentNoteTypeId] : null
}

export const getMediaFilePaths = (
  state: AppState,
  projectId: ProjectId
): Array<AudioMetadataAndPath> => {
  const projectMetadata = getProjectMetadata(state, projectId)
  return projectMetadata ? projectMetadata.mediaFilePaths : []
}
