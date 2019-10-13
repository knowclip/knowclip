import moment from 'moment'
import getAllTags from '../utils/getAllTags'
import { getClips } from '.'
import { getMediaFiles } from './media'

export const getProject = (
  state: AppState,
  projectMetadata: ProjectMetadata
): Project4_0_0 => ({
  version: '4.0.0',
  timestamp: moment.utc().format(),
  name: projectMetadata.name,
  id: projectMetadata.id,
  noteType: projectMetadata.noteType,
  mediaFilesMetadata: getProjectMediaMetadata(state, projectMetadata.id),
  tags: [...getAllTags(state.clips.byId)],
  clips: getMediaFiles(state, projectMetadata.id).reduce(
    (clips, { metadata: { id } }) => [...clips, ...getClips(state, id)],
    [] as Clip[]
  ),
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

export const getMediaMetadataFromCurrentProject = (
  state: AppState,
  id: MediaFileId
): MediaFileMetadata | null => state.media.byId[id].metadata || null

export const getMediaFilePathFromCurrentProject = (
  state: AppState,
  id: MediaFileId
): MediaFilePath | null =>
  state.media.byId[id] ? state.media.byId[id].filePath : null

export const getMediaFileConstantBitratePathFromCurrentProject = (
  state: AppState,
  id: MediaFileId
): MediaFilePath | null =>
  state.media.byId[id] ? state.media.byId[id].constantBitrateFilePath : null

export const getCurrentMediaFileConstantBitratePath = (
  state: AppState
): MediaFilePath | null =>
  state.user.currentMediaFileId
    ? getMediaFileConstantBitratePathFromCurrentProject(
        state,
        state.user.currentMediaFileId
      )
    : null

export const getCurrentFilePath = (state: AppState): MediaFilePath | null => {
  const currentFileId = state.user.currentMediaFileId
  return currentFileId
    ? getMediaFilePathFromCurrentProject(state, currentFileId)
    : null
}

export const getProjectMediaMetadata = (
  state: AppState,
  projectId: ProjectId
): Array<MediaFileMetadata> =>
  getMediaFiles(state, projectId).map(({ metadata }) => metadata)

export const getCurrentMediaFile = (state: AppState): MediaFile | null => {
  const { currentMediaFileId } = state.user
  return currentMediaFileId ? state.media.byId[currentMediaFileId] : null
}

export const getCurrentMediaMetadata = (
  state: AppState
): MediaFileMetadata | null => {
  const currentMediaFile = getCurrentMediaFile(state)
  return currentMediaFile ? currentMediaFile.metadata : null
}

export const isWorkUnsaved = (state: AppState): boolean =>
  state.user.workIsUnsaved
