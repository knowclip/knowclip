declare type ProjectId = string
declare type ProjectFilePath = string

declare type AudioMetadataAndPath = Exact<{
  metadata: MediaFileMetadata,
  filePath: ?MediaFilePath,
}>

declare type ProjectMetadata = Exact<{
  id: ProjectId,
  filePath: ProjectFilePath,
  name: string,
  mediaFilePaths: Array<AudioMetadataAndPath>,
  error: ?string,
}>

declare type ProjectsState = Exact<{
  byId: { [ProjectId]: ProjectMetadata },
  allIds: Array<ProjectId>,
}>
