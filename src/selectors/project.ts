import moment from 'moment'
import getAllTags from '../utils/getAllTags'
import { getClips } from '.'
import { getProjectMediaFileRecords } from './media'
import { getFileRecord, getLoadedFileById } from './files'
import { extname } from 'path'

export const getProject = (
  state: AppState,
  projectMetadata: ProjectMetadata
): Project4_1_0 => ({
  version: '4.1.0',
  timestamp: moment.utc().format(),
  name: projectMetadata.name,
  id: projectMetadata.id,
  noteType: projectMetadata.noteType,
  mediaFiles: getProjectMediaFileRecords(state, projectMetadata.id),
  tags: [...getAllTags(state.clips.byId)],
  clips: getProjectMediaFileRecords(state, projectMetadata.id).reduce(
    (clips, { id }) => [...clips, ...getClips(state, id)],
    [] as Clip[]
  ),
  subtitles: [],
})

export const getProjects = (state: AppState): Array<ProjectMetadata> =>
  state.projects.allIds.map(id => state.projects.byId[id])

export const getProjectIdByFilePath = (
  state: AppState,
  filePath: MediaFilePath
): ProjectId | null =>
  state.projects.allIds.find(
    id => state.projects.byId[id].filePath === filePath
  ) || null

export const getProjectMetadata = (
  state: AppState,
  id: ProjectId
): ProjectMetadata | null => state.projects.byId[id] || null

export const getCurrentProjectId = (state: AppState): ProjectId | null =>
  state.user.currentProjectId

export const getCurrentProject = (state: AppState): ProjectMetadata | null => {
  const currentProjectId = getCurrentProjectId(state)
  return currentProjectId ? state.projects.byId[currentProjectId] : null
}

export const getMediaFileConstantBitratePathFromCurrentProject = (
  state: AppState,
  id: MediaFileId
): MediaFilePath | null => {
  const loadedFile = getLoadedFileById(state, 'MediaFile', id)
  if (
    loadedFile &&
    loadedFile.filePath &&
    extname(loadedFile.filePath).toLowerCase() !== '.mp3'
  )
    return loadedFile.status === 'CURRENTLY_LOADED' ? loadedFile.filePath : null

  const loadedCbr = getLoadedFileById(state, 'ConstantBitrateMp3', id)
  if (loadedCbr && loadedCbr.filePath)
    return loadedCbr.status === 'CURRENTLY_LOADED' ? loadedCbr.filePath : null

  return null
}
export const getCurrentFilePath = (state: AppState): MediaFilePath | null => {
  const currentFileId = state.user.currentMediaFileId
  if (!currentFileId) return null

  const currentFile = getLoadedFileById(state, 'MediaFile', currentFileId)
  return currentFile && currentFile.status === 'CURRENTLY_LOADED'
    ? currentFile.filePath
    : null
}

export const getCurrentMediaFileConstantBitratePath = (
  state: AppState
): MediaFilePath | null =>
  state.user.currentMediaFileId
    ? getMediaFileConstantBitratePathFromCurrentProject(
        state,
        state.user.currentMediaFileId
      )
    : null

export const getCurrentMediaFileRecord = (
  state: AppState
): MediaFileRecord | null => {
  const { currentMediaFileId } = state.user
  return currentMediaFileId
    ? getFileRecord(state, 'MediaFile', currentMediaFileId)
    : null
}

export const isWorkUnsaved = (state: AppState): boolean =>
  state.user.workIsUnsaved
