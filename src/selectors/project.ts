import moment from 'moment'
import getAllTags from '../utils/getAllTags'
import { getClips } from '.'
import { getProjectMediaFiles } from './media'
import { getFile, getFileAvailabilityById } from './files'
import { extname } from 'path'
import { createSelector } from 'reselect'

export const getProject = (
  state: AppState,
  file: ProjectFile
): Project4_1_0 => ({
  version: '4.1.0',
  timestamp: moment.utc().format(),
  name: file.name,
  id: file.id,
  noteType: file.noteType,
  lastOpened: file.lastOpened,
  mediaFiles: getProjectMediaFiles(state, file.id),
  tags: [...getAllTags(state.clips.byId)],
  clips: getProjectMediaFiles(state, file.id).reduce(
    (clips, { id }) => [...clips, ...getClips(state, id)],
    [] as Clip[]
  ),
  subtitles: [],
})

const newestToOldest = (
  { lastOpened: a }: ProjectFile,
  { lastOpened: b }: ProjectFile
) => moment(b).valueOf() - moment(a).valueOf()
export const getProjects = createSelector(
  (state: AppState) => state.files.ProjectFile,
  (projectFiles): Array<ProjectFile> =>
    Object.values(projectFiles).sort(newestToOldest)
)

export const getProjectIdByFilePath = (
  state: AppState,
  filePath: string
): ProjectId | null =>
  Object.keys(state.fileAvailabilities.ProjectFile).find(
    id => state.fileAvailabilities.ProjectFile[id].filePath === filePath
  ) || null

export const getCurrentProjectId = (state: AppState): ProjectId | null =>
  state.user.currentProjectId

export const getCurrentProject = (state: AppState): ProjectFile | null => {
  const currentProjectId = getCurrentProjectId(state)
  return currentProjectId
    ? getFile<ProjectFile>(state, 'ProjectFile', currentProjectId)
    : null
}

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
