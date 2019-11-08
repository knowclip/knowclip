import { getCurrentFilePath, getCurrentMediaFileRecord } from './project'

export const getPreviouslyLoadedFile = (
  state: AppState,
  fileRecord: FileRecord
): LoadedFile | null => state.loadedFiles[fileRecord.type][fileRecord.id]

export const getFileRecord = <F extends FileRecord>(
  state: AppState,
  type: F['type'],
  id: FileId
): F | null => (state.fileRecords[type][id] as F) || null

export const getLoadedFileById = <F extends FileRecord>(
  state: AppState,
  type: F['type'],
  id: FileId
) => {
  const record = getFileRecord(state, type, id)
  return record ? getPreviouslyLoadedFile(state, record) : null
}

export const getWaveformPath = (state: AppState): string | null => {
  const currentMediaFile = getCurrentMediaFileRecord(state)
  if (!currentMediaFile) return null

  const waveformFile = getLoadedFileById(
    state,
    'WaveformPng',
    currentMediaFile.id
  )
  return waveformFile ? waveformFile.filePath : null
}
