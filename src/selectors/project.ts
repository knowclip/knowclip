import moment from 'moment'
import getAllTags from '../utils/getAllTags'
import { getClips } from '.'
import { getProjectMediaFileRecords } from './media'
import { getFileRecord, getLoadedFileById } from './files'
import { extname } from 'path'
import { createSelector } from 'reselect'

export const getProject = (
  state: AppState,
  fileRecord: ProjectFileRecord
): Project4_1_0 => ({
  version: '4.1.0',
  timestamp: moment.utc().format(),
  name: fileRecord.name,
  id: fileRecord.id,
  noteType: fileRecord.noteType,
  lastOpened: fileRecord.lastOpened,
  mediaFiles: getProjectMediaFileRecords(state, fileRecord.id),
  tags: [...getAllTags(state.clips.byId)],
  clips: getProjectMediaFileRecords(state, fileRecord.id).reduce(
    (clips, { id }) => [...clips, ...getClips(state, id)],
    [] as Clip[]
  ),
  subtitles: [],
})

const newestToOldest = (
  { lastOpened: a }: ProjectFileRecord,
  { lastOpened: b }: ProjectFileRecord
) => moment(b).valueOf() - moment(a).valueOf()
export const getProjects = createSelector(
  (state: AppState) => state.fileRecords.ProjectFile,
  (projectFiles): Array<ProjectFileRecord> =>
    Object.values(projectFiles).sort(newestToOldest)
)

export const getProjectIdByFilePath = (
  state: AppState,
  filePath: string
): ProjectId | null =>
  Object.keys(state.loadedFiles.ProjectFile).find(
    id => state.loadedFiles.ProjectFile[id].filePath === filePath
  ) || null

export const getCurrentProjectId = (state: AppState): ProjectId | null =>
  state.user.currentProjectId

export const getCurrentProject = (
  state: AppState
): ProjectFileRecord | null => {
  const currentProjectId = getCurrentProjectId(state)
  return currentProjectId
    ? getFileRecord<ProjectFileRecord>(state, 'ProjectFile', currentProjectId)
    : null
}

export const getConstantBitrateFilePath = (
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

export const getCurrentMediaConstantBitrateFilePath = (
  state: AppState
): MediaFilePath | null =>
  state.user.currentMediaFileId
    ? getConstantBitrateFilePath(state, state.user.currentMediaFileId)
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
