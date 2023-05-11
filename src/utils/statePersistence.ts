type FilesyState<F> = Record<FileMetadata['type'], { [fileId: string]: F }>

const FILE_TYPES: FileMetadata['type'][] = [
  'ProjectFile',
  'MediaFile',
  'ExternalSubtitlesFile',
  'VttConvertedSubtitlesFile',
  'WaveformPng',
  'ConstantBitrateMp3',
  'VideoStillImage',
  'Dictionary',
]

const mapFileState = <F, G>(
  state: FilesyState<F>,
  transform: (type: FileMetadata['type'], f: F) => G
) =>
  FILE_TYPES.reduce((all, type) => {
    all[type] = Object.keys(state[type] || {}).reduce((xxx, id) => {
      xxx[id] = transform(type, state[type][id])
      return xxx
    }, {} as { [fileId: string]: G })
    return all
  }, {} as FilesyState<G>)

export function resetFileAvailabilities(
  fileAvailabilities: FileAvailabilitiesState
): FileAvailabilitiesState {
  return mapFileState(fileAvailabilities, (type, fa): KnownFile => {
    const fileAvailability = fa as KnownFile
    switch (fileAvailability.status) {
      case 'CURRENTLY_LOADED':
        return {
          id: fileAvailability.id,
          type: fileAvailability.type,
          parentId: fileAvailability.parentId,
          name: fileAvailability.name,
          status: 'PREVIOUSLY_LOADED',
          filePath: fileAvailability.filePath,
          isLoading: false,
          lastOpened: fileAvailability.lastOpened,
        }
      case 'PENDING_DELETION':
        return fileAvailability.lastOpened && fileAvailability.filePath
          ? {
              id: fileAvailability.id,
              type: fileAvailability.type,
              parentId: fileAvailability.parentId,
              name: fileAvailability.name,
              filePath: fileAvailability.filePath,
              lastOpened: fileAvailability.lastOpened,
              isLoading: false,
              status: 'PREVIOUSLY_LOADED',
            }
          : {
              id: fileAvailability.id,
              type: fileAvailability.type,
              parentId: fileAvailability.parentId,
              name: fileAvailability.name,
              filePath: fileAvailability.filePath,
              lastOpened: null,
              isLoading: false,
              status: 'NEVER_LOADED',
            }
      case 'FAILED_TO_LOAD':
        return {
          id: fileAvailability.id,
          type: fileAvailability.type,
          parentId: fileAvailability.parentId,
          name: fileAvailability.name,
          status: fileAvailability.status,
          filePath: fileAvailability.filePath,
          isLoading: false,
          lastOpened: fileAvailability.lastOpened,
        }
      case 'PREVIOUSLY_LOADED':
        return {
          id: fileAvailability.id,
          type: fileAvailability.type,
          parentId: fileAvailability.parentId,
          name: fileAvailability.name,
          status: fileAvailability.status,
          filePath: fileAvailability.filePath,
          isLoading: false,
          lastOpened: fileAvailability.lastOpened,
        }
      case 'NEVER_LOADED':
        return {
          id: fileAvailability.id,
          type: fileAvailability.type,
          parentId: fileAvailability.parentId,
          name: fileAvailability.name,
          status: fileAvailability.status,
          filePath: fileAvailability.filePath,
          isLoading: false,
          lastOpened: fileAvailability.lastOpened,
        }
    }
  })
}
