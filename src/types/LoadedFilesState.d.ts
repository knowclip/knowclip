declare type LoadedFilesState = { [fileId: string]:? LoadedFile}

declare type LoadedFile = CurrentlyLoadedFile | NotCurrentlyLoadedFile


declare type CurrentlyLoadedFile = {
  id: FileId
  status: 'CURRENTLY_LOADED'
  filePath: FilePath
}
declare type NotCurrentlyLoadedFile =  {
  id: FileId
  status: 'REMEMBERED'
  filePath: FilePath
}

declare type LoadedFileData = {
  type: 'ExternalSubtitlesFile',
  subtitles: ExternalSubtitlesTrack
}