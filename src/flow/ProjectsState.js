declare type ProjectId = string
declare type ProjectFilePath = string

declare type ProjectMetadata = {
  id: ProjectId,
  filePath: ProjectFilePath,
  name: string,
  audioFilePaths: { [AudioFileId]: AudioFilePath },
}

declare type ProjectsState = {
  byId: { [ProjectId]: ProjectMetadata },
  allIds: Array<ProjectId>,
}
