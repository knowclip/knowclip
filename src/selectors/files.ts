import { getCurrentMediaFile } from './project'

export const getFileAvailability = (
  state: AppState,
  file: FileMetadata
): FileAvailability | null => state.fileAvailabilities[file.type][file.id]

export const getFile = <F extends FileMetadata>(
  state: AppState,
  type: F['type'],
  id: FileId
): F | null => (state.files[type][id] as F) || null

export const getFileAvailabilityById = <F extends FileMetadata>(
  state: AppState,
  type: F['type'],
  id: FileId
) => {
  const record = getFile(state, type, id)
  return record ? getFileAvailability(state, record) : null
}

export const getWaveformPath = (state: AppState): string | null => {
  const currentMediaFile = getCurrentMediaFile(state)
  if (!currentMediaFile) return null

  const waveformFile = getFileAvailabilityById(
    state,
    'WaveformPng',
    currentMediaFile.id
  )
  return waveformFile ? waveformFile.filePath : null
}
