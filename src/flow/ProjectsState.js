declare type ProjectId = string
declare type ProjectFilePath = string

declare type AudioMetadataAndPath = Exact<{
  metadata: AudioFileMetadata,
  filePath: ?AudioFilePath,
}>

declare type ProjectMetadata = Exact<{
  id: ProjectId,
  filePath: ProjectFilePath,
  name: string,
  audioFilePaths: Array<AudioMetadataAndPath>,
  error: ?string,
}>

declare type ProjectsState = Exact<{
  byId: { [ProjectId]: ProjectMetadata },
  allIds: Array<ProjectId>,
}>
