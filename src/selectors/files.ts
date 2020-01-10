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

export const getFileDescendants = (
  state: AppState,
  id: FileId,
  descendants: Array<FileMetadata> = []
): Array<FileMetadata> => {
  // TODO: speed this up jic there are lots of files
  for (const filesHash of Object.values(state.files)) {
    for (const fileId in filesHash) {
      const file = filesHash[fileId]
      // TODO: check if we should check parentType as well
      if (
        !descendants.includes(file) &&
        'parentId' in file &&
        file.parentId === id
      ) {
        descendants.push(file)

        getFileDescendants(state, fileId, descendants)
      }
    }
  }

  return descendants
}
