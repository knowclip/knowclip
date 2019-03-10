declare type ProjectId = String

declare type ProjectMetadata = {
  id: ProjectId,
  audioFilePaths: { [AudioFileId]: AudioFilePath }
}

declare type ProjectsState = {
  byId: { [ProjectId]: ProjectMetadata }
}