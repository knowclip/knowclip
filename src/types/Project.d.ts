declare type Project =
  | Project0_0_0
  | Project1_0_0
  | Project2_0_0
  | Project3_0_0
  | Project4_0_0
  | Project4_1_0

declare type ProjectId = string

declare type Project0_0_0 = {
  version: '0.0.0'
  audioFileName: MediaFileName
  noteType: NoteTypePre3_0_0
  clips: Record<ClipId, ClipWithoutFilePath>
}

declare type Project1_0_0 = {
  version: '1.0.0'
  audioFileName: MediaFileName
  audioFileId: MediaFileId
  noteType: NoteTypePre3_0_0
  clips: Record<ClipId, ClipPre3_0_0>
}

declare type Project2_0_0 = {
  version: '2.0.0'
  id: ProjectId
  name: string
  mediaFilesMetadata: Array<MediaFileMetadata_Pre_4>
  noteType: NoteTypePre3_0_0
  clips: Record<ClipId, ClipPre3_0_0>
  tags: Array<string>
  timestamp: string
}

declare type Project3_0_0 = {
  version: '3.0.0'
  id: ProjectId
  name: string
  mediaFilesMetadata: Array<MediaFileMetadata_Pre_4>
  noteType: NoteType
  clips: Record<ClipId, Clip>
  tags: Array<string>
  timestamp: string
}

declare type Project4_0_0 = {
  version: '4.0.0'
  id: ProjectId
  name: string
  mediaFilesMetadata: Array<MediaFileMetadata>
  noteType: NoteType
  clips: Array<Clip>
  tags: Array<string> // maybe shouldnt be saved here
  timestamp: string
}

declare type Project4_1_0 = {
  version: '4.1.0'
  id: ProjectId
  name: string
  mediaFiles: Array<MediaFileRecord>
  noteType: NoteType
  clips: Array<Clip>
  tags: Array<string> // maybe shouldnt be saved here
  timestamp: string
  lastOpened: string
  subtitles: Array<SubtitlesTrack>
}

declare type ProjectExport = {
  project: ProjectMetadata
  clips: Array<Clip>
}
