declare type WaveformX = number

declare type ClipId = string

declare type Clip = {
  id: ClipId
  start: WaveformX
  end: WaveformX
  fileId: MediaFileId
  flashcard: Flashcard
}

declare type ClipsState = {
  byId: {
    [ClipId: string]: Clip
  }
  idsByMediaFileId: {
    [mediaFileId: string]: Array<ClipId>
  }
}

// declare type FlashcardFieldName =
//   | TransliterationFlashcardFieldName
//   | SimpleFlashcardFieldName

// declare type TransliterationFlashcardFieldName =
//   | 'transcription'
//   | 'pronunciation'
//   | 'meaning'
//   | 'notes'
// declare type SimpleFlashcardFieldNames = [
//   FlashcardFieldName.transcription,
//   FlashcardFieldName.meaning,
//   FlashcardFieldName.notes,
// ]

// type FlashcardFields =
//   | SimpleNoteTypeFields
//   | TransliterationNoteTypeFields
// type SimpleNoteTypeFields = {|
//   transcription: string,
//   meaning: string,
//   notes: string,
// |}
// type TransliterationNoteTypeFields = {|
//   transcription: string,
//   pronunciation: string,
//   meaning: string,
//   notes: string,
// |}

enum FlashcardFieldName {
  transcription = 'transcription',
  pronunciation = 'pronunciation',
  meaning = 'meaning',
  notes = 'notes',
}

declare type FlashcardFields =
  | SimpleFlashcardFields
  | TransliterationFlashcardFields

// declare type SimpleFlashcardFields = { [K in SimpleFlashcardFieldName]: string }
// declare type TransliterationFlashcardFields = {
//   [K in TransliterationFlashcardFieldName]: string
// }

declare type SimpleFlashcardFields = {
  [FlashcardFieldName.transcription]: string
  [FlashcardFieldName.transliteration]: string
  [FlashcardFieldName.notes]: string
  [FlashcardFieldName.meaning]: string
}

declare type TransliterationFlashcardFields = {
  [FlashcardFieldName.transcription]: string
  [FlashcardFieldName.transliteration]: string
  [FlashcardFieldName.meaning]: string
  [FlashcardFieldName.notes]: string
  [FlashcardFieldName.pronunciation]: string
}

declare type Flashcard =
  | {
      // change to note?
      // make exact
      id: ClipId
      type: 'Simple'
      fields: SimpleFlashcardFields
      tags: Array<string>
    }
  | {
      id: ClipId
      type: 'Transliteration'
      fields: TransliterationFlashcardFields
      tags: Array<string>
    }

declare type PendingClip = {
  start: WaveformX
  end: WaveformX
}

declare type ClipSpecs = {
  sourceFilePath: string
  outputFilename: string
  startTime: number
  endTime: number
  flashcardSpecs: {
    fields: Array<string>
    tags: Array<string>
    due: number
    sortField: string
  }
}

declare type ApkgExportData = {
  deckName: string
  template: {
    fields: Array<string> // field names,
    cards: Array<{
      name: string
      questionFormat: string
      answerFormat: string
    }>
    css: string
  }
  clips: Array<ClipSpecs>
}

declare type ClipPre3_0_0 = {
  id: ClipId
  start: WaveformX
  end: WaveformX
  fileId: MediaFileId
  flashcard: FlashcardPre3_0_0
}

declare type FlashcardPre3_0_0 = {
  id: ClipId
  fields: {
    [K: string]: string
  }
  tags: Array<string>
}

// project file version 0.0.0
declare type ClipWithoutFilePath = {
  id: ClipId
  start: WaveformX
  end: WaveformX
  flashcard: {
    id: ClipId
    fields: {
      [NoteFieldId: string]: string
    }
    tags: Array<string> | null
  }
}
