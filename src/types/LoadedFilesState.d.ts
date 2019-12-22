declare type LoadedFilesState = Record<
  FileRecord['type'],
  Record<FileId, LoadedFile>
>

declare type LoadedFile =
  | CurrentlyLoadedFile
  | NotCurrentlyLoadedFile
  | NotLoadedFile

declare type CurrentlyLoadedFile = {
  id: FileId
  status: 'CURRENTLY_LOADED'
  filePath: FilePath
}
declare type NotCurrentlyLoadedFile = {
  id: FileId
  status: 'REMEMBERED' // once loaded on this computer
  filePath: FilePath
}
declare type NotLoadedFile = {
  id: FileId
  status: 'NOT_LOADED'
  filePath: null
}
