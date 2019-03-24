// @flow
import * as audioSelectors from './audio'
import getAllTags from '../utils/getAllTags'

export const getProject = (
  state: AppState,
  projectMetadata: ProjectMetadata
): Project2_0_0 => {
  const noteType = audioSelectors.getCurrentNoteType(state)
  if (!noteType) throw new Error('no note type found')

  return {
    version: '2.0.0',
    noteType,
    id: projectMetadata.id,
    name: projectMetadata.name,
    mediaFilesMetadata: projectMetadata.audioFilePaths.map(
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
  filePath: AudioFilePath
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

export const getMediaFilePathFromCurrentProject = (
  state: AppState,
  id: AudioFileId
): ?AudioFilePath => {
  const currentProject = getCurrentProject(state)
  if (!currentProject) return null
  const fileMetadata = currentProject.audioFilePaths.find(
    mediaMetadata => mediaMetadata.metadata.id === id
  )
  return fileMetadata ? fileMetadata.filePath : null
}

export const getCurrentFilePath = (state: AppState): ?AudioFilePath => {
  const currentFileId = state.user.currentMediaFileId
  return currentFileId
    ? getMediaFilePathFromCurrentProject(state, currentFileId)
    : null
}

export const getProjectMediaMetadata = (
  state: AppState,
  projectId: ProjectId
): Array<AudioFileMetadata> => {
  const project = getProjectMetadata(state, projectId)
  return project ? project.audioFilePaths.map(({ metadata }) => metadata) : []
}
