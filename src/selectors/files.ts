import { getCurrentMediaFile } from '.'

export const getFileAvailability = (
  state: AppState,
  file: FileMetadata
): StoredFile | NeverLoadedFile =>
  state.fileAvailabilities[file.type][file.id] || {
    status: 'NOT_LOADED',
    id: file.id,
    filePath: null,
  }

export const getFile = <F extends FileMetadata>(
  state: AppState,
  type: F['type'],
  id: FileId
): F | null => (state.files[type][id] as F) || null

export const getFileWithAvailability = <F extends FileMetadata>(
  state: AppState,
  type: F['type'],
  id: FileId
): FileWithAvailability<F> => {
  const file = getFile(state, type, id)
  if (!file)
    return {
      file,
      availability: {
        status: 'NOT_FOUND',
        id,
        filePath: null,
        isLoading: false,
      },
    }

  const availability = getFileAvailability(state, file)
  return { file, availability }
}

export const getFileAvailabilityById = <F extends FileMetadata>(
  state: AppState,
  type: F['type'],
  id: FileId
): FileAvailability => {
  const record = getFile(state, type, id)
  return record
    ? getFileAvailability(state, record)
    : { status: 'NOT_FOUND', id, filePath: null, isLoading: false }
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
