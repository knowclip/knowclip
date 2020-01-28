declare type FileAvailabilitiesState = Record<
  FileMetadata['type'],
  Record<FileId, StoredFile | NeverLoadedFile>
>

declare type FileAvailability = StoredFile | NeverLoadedFile | NotFoundFile

declare type StoredFile = CurrentlyLoadedFile | NotCurrentlyLoadedFile

declare type CurrentlyLoadedFile = {
  // loadedthissession
  id: FileId
  status: 'CURRENTLY_LOADED'
  filePath: FilePath
  isLoading: boolean
}
declare type NotCurrentlyLoadedFile = {
  id: FileId
  status: 'REMEMBERED'
  filePath: FilePath
  isLoading: boolean
}
declare type NeverLoadedFile = {
  id: FileId
  status: 'NOT_LOADED'
  filePath: null
  isLoading: boolean
}
declare type NotFoundFile = {
  id: FileId
  status: 'NOT_FOUND'
  filePath: null
  isLoading: false
}

declare type FileWithAvailability<F extends FileMetadata> =
  | {
      file: F
      availability: StoredFile | NeverLoadedFile
    }
  | {
      file: null
      availability: NotFoundFile
    }
