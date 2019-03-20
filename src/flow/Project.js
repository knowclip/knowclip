// @flow
declare type AudioFileName = string

declare type Project = Project0_0_0 | Project1_0_0 | Project2_0_0

declare type Project0_0_0 = {
  version: '0.0.0',
  audioFileName: AudioFileName,
  noteType: NoteType,
  clips: { [ClipId]: ClipWithoutFilePath },
}

declare type Project1_0_0 = {
  version: '1.0.0',
  audioFileName: AudioFileName,
  audioFileId: AudioFileId,
  noteType: NoteType,
  clips: { [ClipId]: Clip },
}

declare type Project2_0_0 = {
  version: '2.0.0',
  id: ProjectId,
  name: string,
  mediaFilesMetadata: Array<AudioFileMetadata>,
  noteType: NoteType,
  clips: { [ClipId]: Clip },
  tags: Array<string>,
}
