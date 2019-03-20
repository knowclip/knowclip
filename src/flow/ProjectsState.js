declare type ProjectId = string
declare type ProjectFilePath = string

declare type ProjectMetadata = {
  id: ProjectId,
  filePath: ProjectFilePath,
  name: string,
  audioFilePaths: Array<{ id: AudioFileId, filePath: ?AudioFilePath }>,
  error: ?string,
}

declare type ProjectsState = {
  byId: { [ProjectId]: ProjectMetadata }, 
  allIds: Array<ProjectId>,
}
