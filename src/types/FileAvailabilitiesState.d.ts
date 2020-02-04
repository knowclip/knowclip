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
  | PendingDeletionFile

declare type PreviouslyLoadedFile = {
  id: FileId
  parentId: FileId | null
  name: string
  /** A file that was successfully opened
   * previously to this session.
   */
  status: 'PREVIOUSLY_LOADED'
  filePath: FilePath
  isLoading: boolean
  lastOpened: string
  type: FileMetadata['type']
}

declare type CurrentlyLoadedFile = {
  id: FileId
  parentId: FileId | null
  name: string
  /** A file that was successfully opened
   * this session.
   */
  status: 'CURRENTLY_LOADED'
  filePath: FilePath
  isLoading: boolean
  lastOpened: string
  type: FileMetadata['type']
}

declare type ErroredFile = {
  id: FileId
  parentId: FileId | null
  name: string
  /** A file that has failed to open at the most
   * recent attempt.
   */
  status: 'FAILED_TO_LOAD'
  // error message as well?
  // TODO: should show in UI for media files/subtitles when one is in this state
  filePath: string | null
  isLoading: boolean
  lastOpened: string | null
  type: FileMetadata['type']
}

declare type NeverLoadedFile = {
  id: FileId
  parentId: FileId | null
  name: string
  /** Stored in state but was never loaded.
   * From a project file that was opened
   * for the first time recently.
   */
  status: 'NEVER_LOADED'
  filePath: string | null
  isLoading: boolean
  lastOpened: null
  type: FileMetadata['type']
}

declare type PendingDeletionFile = {
  id: FileId
  parentId: FileId | null
  name: string
  /** A file whose record is being kept
   * in case the user does not save the parent project
   * after choosing to delete it.
   */
  status: 'PENDING_DELETION'
  filePath: string | null
  isLoading: false
  lastOpened: string | null
  type: FileMetadata['type']
}

declare type NotFoundFile = {
  id: FileId
  parentId: FileId | null
  name: string
  /** Not stored in state tree.
   * This is a placeholder value
   * returned by selectors.
   */
  status: 'NOT_FOUND'
  filePath: null
  isLoading: false
  lastOpened: null
  type: FileMetadata['type']
}

declare type FileWithAvailability<F extends FileMetadata> = {
  file: F | null
  availability: FileAvailability
}
