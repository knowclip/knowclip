// @flow
import { basename } from 'path'
import { getCurrentFilePath, getProjectMetadata } from './project'

export const isLoopOn = (state: AppState) => state.audio.loop

export const getCurrentFileName = (state: AppState): ?MediaFileName => {
  const filePath = getCurrentFilePath(state)
  return filePath && basename(filePath)
}

export const getCurrentFileId = ({ user }: AppState): ?MediaFileId =>
  user.currentMediaFileId

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
