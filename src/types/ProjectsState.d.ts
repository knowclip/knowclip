declare type ProjectFilePath = string

declare type AudioMetadataAndPath = {
  metadata: MediaFileMetadata
  filePath: MediaFilePath | null
  constantBitrateFilePath: MediaFilePath | null
  error: string | null
}

declare type ProjectMetadata = {
  id: ProjectId
  filePath: ProjectFilePath
  name: string
  noteType: NoteType
  mediaFilePaths: Array<AudioMetadataAndPath>
  error: string | null
}

declare type ProjectsState = {
  byId: Record<ProjectId, ProjectMetadata>
  allIds: Array<ProjectId>
}
