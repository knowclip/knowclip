import { getHumanFileName } from '../utils/files'

export const fileByIdUrl = (localServerAddress: string, fileId: FileId) =>
  `${localServerAddress}/file/${fileId}`
export const convertedFilePlaylistByIdUrl = (
  localServerAddress: string,
  fileId: FileId
) => `${localServerAddress}/file/${fileId}/converted/index.m3u8`
export const getFileUrl = (state: AppState, fileId: FileId): string =>
  fileByIdUrl(state.session.localServerAddress, fileId)

export const getFileAvailability = (
  state: AppState,
  file: FileMetadata
): KnownFile =>
  state.fileAvailabilities[file.type][file.id] || {
    status: 'NEVER_LOADED',
    type: file.type,
    parentId: 'parentId' in file ? file.parentId : null,
    name: `Unknown ${getHumanFileName(file)}`,
    id: file.id,
    filePath: null,
    isLoading: false,
    lastOpened: null,
  }

export const getFile = <F extends FileMetadata>(
  state: AppState,
  type: F['type'],
  id: FileId
): F | null => (state.files[type][id] as F) || null

export const getFileAvailabilityById = <F extends FileMetadata>(
  state: AppState,
  type: F['type'],
  id: FileId
): FileAvailability => {
  return (
    state.fileAvailabilities[type][id] || {
      status: 'NOT_FOUND',
      type,
      parentId: null,
      name: `Unknown ${getHumanFileName({ type })}`,
      id,
      filePath: null,
      isLoading: false,
      lastOpened: null,
    }
  )
}

export const getFileWithAvailability = <F extends FileMetadata>(
  state: AppState,
  type: F['type'],
  id: FileId
): FileWithAvailability<F> => {
  const file = getFile(state, type, id)

  const availability = getFileAvailabilityById(state, type, id)
  return { file, availability }
}

export const getFileDescendants = (
  state: AppState,
  id: FileId,
  descendants: Array<FileAvailability> = []
): Array<FileAvailability> => {
  // TODO: speed this up jic there are lots of files
  for (const filesHash of Object.values(state.fileAvailabilities)) {
    for (const fileId in filesHash) {
      const file = filesHash[fileId] as FileAvailability
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
