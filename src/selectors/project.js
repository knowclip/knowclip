// @flow
import moment from 'moment'
import * as audioSelectors from './audio'
import getAllTags from '../utils/getAllTags'

export const getProject = (
  state: AppState,
  projectMetadata: ProjectMetadata
): Project3_0_0 => {
  const noteType = audioSelectors.getCurrentNoteType(state)
  if (!noteType) throw new Error('no note type found')

  return {
    version: '3.0.0',
    timestamp: moment.utc().format(),
    name: projectMetadata.name,
    id: projectMetadata.id,
    noteType,
    mediaFilesMetadata: projectMetadata.mediaFilePaths.map(
      ({ metadata }) => metadata
    ),
    tags: [...getAllTags(state.clips.byId)],
    clips: state.clips.byId,
  }
}

export const getProjects = (state: AppState): Array<ProjectMetadata> =>
  state.projects.allIds.map(id => state.projects.byId[id])

export const getProjectIdByFilePath = (
  state: AppState,
  filePath: MediaFilePath
): ?ProjectId =>
  state.projects.allIds.find(
    id => state.projects.byId[id].filePath === filePath
  )

export const getProjectMetadata = (
  state: AppState,
  id: ProjectId
): ?ProjectMetadata => state.projects.byId[id]

export const getCurrentProjectId = (state: AppState): ?ProjectId =>
  state.user.currentProjectId

export const getCurrentProject = (state: AppState): ?ProjectMetadata => {
  const currentProjectId = getCurrentProjectId(state)
  return currentProjectId ? state.projects.byId[currentProjectId] : null
}

export const getMediaMetadataFromCurrentProject = (
  state: AppState,
  id: MediaFileId
): ?MediaFileMetadata => {
  const currentProject = getCurrentProject(state)
  if (!currentProject) return null
  const fileMetadata = currentProject.mediaFilePaths.find(
    mediaMetadata => mediaMetadata.metadata.id === id
  )
  return fileMetadata ? fileMetadata.metadata : null
}

export const getMediaFilePathFromCurrentProject = (
  state: AppState,
  id: MediaFileId
): ?MediaFilePath => {
  const currentProject = getCurrentProject(state)
  if (!currentProject) return null
  const fileMetadata = currentProject.mediaFilePaths.find(
    mediaMetadata => mediaMetadata.metadata.id === id
  )
  return fileMetadata ? fileMetadata.filePath : null
}

export const getMediaFileConstantBitratePathFromCurrentProject = (
  state: AppState,
  id: MediaFileId
): ?MediaFilePath => {
  const currentProject = getCurrentProject(state)
  if (!currentProject) return null
  const fileMetadata = currentProject.mediaFilePaths.find(
    mediaMetadata => mediaMetadata.metadata.id === id
  )
  return fileMetadata ? fileMetadata.constantBitrateFilePath : null
}

export const getCurrentMediaFileConstantBitratePath = (
  state: AppState
): ?MediaFilePath =>
  state.user.currentMediaFileId
    ? getMediaFileConstantBitratePathFromCurrentProject(
        state,
        state.user.currentMediaFileId
      )
    : null

export const getCurrentFilePath = (state: AppState): ?MediaFilePath => {
  const currentFileId = state.user.currentMediaFileId
  return currentFileId
    ? getMediaFilePathFromCurrentProject(state, currentFileId)
    : null
}

export const getProjectMediaMetadata = (
  state: AppState,
  projectId: ProjectId
): Array<MediaFileMetadata> => {
  const project = getProjectMetadata(state, projectId)
  return project ? project.mediaFilePaths.map(({ metadata }) => metadata) : []
}

export const getCurrentMediaMetadata = (
  state: AppState
): ?MediaFileMetadata => {
  const currentProjectId = getCurrentProjectId(state)
  if (!currentProjectId) return null

  const currentProjectMediaMetadata = getProjectMediaMetadata(
    state,
    currentProjectId
  )
  if (!currentProjectMediaMetadata) return null

  const { currentMediaFileId } = state.user
  if (!currentMediaFileId) return null

  return currentProjectMediaMetadata.find(({ id }) => id === currentMediaFileId)
}
