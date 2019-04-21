// @flow
declare type WaveformX = number

declare type ClipId = string
declare type Clip = Exact<{
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
  fileId: MediaFileId,
  flashcard: Flashcard,
}>

declare type ClipsState = {
  byId: { [ClipId]: Clip },
  idsByMediaFileId: { [MediaFileId]: Array<ClipId> },
}

declare type Flashcard =
  | {
      // change to note?
      // make exact
      id: ClipId,
      type: 'Simple',
      fields: {| transcription: string, meaning: string, notes: string |},
      tags: Array<string>,
    }
  | {
      id: ClipId,
      type: 'Transliteration',
      fields: {|
        transcription: string,
        pronunciation: string,
        meaning: string,
        notes: string,
      |},
      tags: Array<string>,
    }

declare type PendingClip = {
  start: WaveformX,
  end: WaveformX,
}

// export

declare type ClipSpecs = {
  sourceFilePath: string,
  outputFilename: string,
  startTime: number,
  endTime: number,
  flashcardSpecs: {
    fields: Array<string>,
    tags: Array<string>,
  },
}

declare type ApkgExportData = {
  deckName: string,
  template: {
    fields: Array<string>, // field names
    questionFormat: string,
    answerFormat: string,
  },
  clips: Array<ClipSpecs>,
}

declare type ClipPre3_0_0 = Exact<{
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
  fileId: MediaFileId,
  flashcard: FlashcardPre3_0_0,
}>

declare type FlashcardPre3_0_0 = {
  id: ClipId,
  fields: {
    [string]: string,
  },
  tags: Array<string>,
}

// project file version 0.0.0
declare type ClipWithoutFilePath = Exact<{
  id: ClipId,
  start: WaveformX,
  end: WaveformX,
  flashcard: {
    id: ClipId,
    fields: { [NoteFieldId]: string },
    tags: ?Array<string>,
  },
}>
