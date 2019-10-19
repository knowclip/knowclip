declare type LoadedFilesState = Record<FileId, LoadedFile>

declare type LoadedFile = {
  id: FileId
  loaded: boolean
  filePath: FilePath | null
}
