// @flow
declare type AudioFileName = string

declare type Project0_0_0 = {
  version: '0.0.0',
  audioFileName: AudioFileName,
  noteType: NoteType,
  clips: { [ClipId]: ClipWithoutFilePath },
}
