declare type FileAvailabilitiesState = Record<
  FileMetadata['type'],
  Dict<FileId, KnownFile>
>

declare type FileAvailability = KnownFile | NotFoundFile

declare type KnownFile =
  | PreviouslyLoadedFile
  | ErroredFile
  | CurrentlyLoadedFile
  | NeverLoadedFile

declare type PreviouslyLoadedFile = {
  id: FileId

  /** A file that was successfully opened
   * previously to this session.
   */
  status: 'PREVIOUSLY_LOADED'
  filePath: FilePath
  isLoading: boolean
}

declare type CurrentlyLoadedFile = {
  id: FileId
  /** A file that was successfully opened
   * this session.
   */
  status: 'CURRENTLY_LOADED'
  filePath: FilePath
  isLoading: boolean
}

declare type ErroredFile = {
  id: FileId
  /** A file that has failed to open at the most
   * recent attempt during this session.
   */
  status: 'FAILED_TO_LOAD'
  filePath: filePath | null
  isLoading: boolean
}

declare type NeverLoadedFile = {
  id: FileId
  /** Stored in state but was never loaded.
   * From a project file that was opened
   * for the first time recently.
   */
  status: 'NEVER_LOADED'
  filePath: null
  isLoading: boolean
}
/** Not stored in state tree. */

declare type NotFoundFile = {
  id: FileId
  /** Not stored in state tree.
   * This is a placeholder value
   * returned by selectors.
   */
  status: 'NOT_FOUND'
  filePath: null
  isLoading: false
}

declare type FileWithAvailability<F extends FileMetadata> =
  | {
      file: F
      availability: KnownFile | NeverLoadedFile
    }
  | {
      file: null
      availability: NotFoundFile
    }
