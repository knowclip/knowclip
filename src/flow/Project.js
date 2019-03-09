// @flow
declare type AudioFileName = string

declare type Project = Project0_0_0 | Project1_0_0

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
  // audioFileMetadata: AudioFileMetadata,
  noteType: NoteType,
  clips: { [ClipId]: Clip },
}
