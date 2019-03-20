// @flow
import * as audioSelectors from './audio'

export const getProject = (state: AppState): Project1_0_0 => {
  const noteType = audioSelectors.getCurrentNoteType(state)
  if (!noteType) throw new Error('no note type found')
  const audioFileName = audioSelectors.getCurrentFileName(state)
  if (!audioFileName) throw new Error('no audio file name found')
  const audioFileId = audioSelectors.getCurrentFileId(state)
  if (!audioFileId) throw new Error('no audio file id found')

  return {
    version: '1.0.0',
    clips: state.clips.byId,
    noteType,
    audioFileName,
    audioFileId,
  }
}

export const getProjects = (state: AppState): Array<ProjectMetadata> =>
  state.projects.allIds.map(id => state.projects.byId[id])

export const getProjectIdByFilePath = (state: AppState, filePath: AudioFilePath): ?ProjectId => state.projects.allIds.find((id) => state.projects.byId[id].filePath === filePath)

export const getProjectMetadata = (state: AppState, id: ProjectId): ?ProjectMetadata =>
  state.projects.byId[id]

export const getCurrentProjectId = (state: AppState): ?ProjectId => state.user.currentProjectId

export const getCurrentProject = (state: AppState): ?ProjectMetadata => {
  const currentProjectId = getCurrentProjectId(state)
  return currentProjectId ? state.projects.byId[currentProjectId] : null
}

export const getMediaFilePathFromCurrentProject = (state: AppState, id: AudioFileId): ?AudioFilePath => {
  const currentProject = getCurrentProject(state)
  if (!currentProject) return null
  const fileMetadata = currentProject.audioFilePaths.find((mediaMetadata) => mediaMetadata.id === id)
  return fileMetadata ? fileMetadata.filePath : null
}

export const getCurrentFile = (state: AppState): ?AudioFileData => {
  const id = state.user.currentMediaFileId
  const path = id && getMediaFilePathFromCurrentProject(state, id)
  return id && path ? {
    id,
    noteTypeId: 'default',
    path: path,
  } : null
}

export const getCurrentFilePath = (state: AppState): ?AudioFilePath => {
  const file = getCurrentFile(state)
  return file ? file.path : null
}