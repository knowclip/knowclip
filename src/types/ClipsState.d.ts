declare type WaveformX = number

declare type ClipId = string

declare type Clip = {
  id: ClipId
  start: WaveformX
  end: WaveformX
  fileId: MediaFileId
  flashcard: Flashcard
  linkedSubtitlesChunk?: number
}

declare type ClipsState = {
  byId: Record<ClipId, Clip>
  idsByMediaFileId: Record<MediaFileId, ClipId[]>
}

declare interface FlashcardFields {
  transcription: string
  meaning: string
  notes: string
}

// declare interface SimpleFlashcardFields extends FlashcardFields {}
// declare interface TransliterationFlashcardFields extends FlashcardFields {
//   pronunciation: string
// }

declare type FlashcardFieldName =
  | SimpleFlashcardFieldName
  | TransliterationFlashcardFieldName
declare type SimpleFlashcardFieldName = 'transcription' | 'meaning' | 'notes'
declare type TransliterationFlashcardFieldName =
  | 'transcription'
  | 'meaning'
  | 'notes'
  | 'pronunciation'

// change to note?
declare type Flashcard = SimpleFlashcard | TransliterationFlashcard
declare type SimpleFlashcard = {
  id: ClipId
  type: 'Simple'
  fields: import('./Project').SimpleFlashcardFields
  tags: Array<string>
  image?: FlashcardImage | null
}
declare type TransliterationFlashcard = {
  id: ClipId
  type: 'Transliteration'
  fields: import('./Project').TransliterationFlashcardFields
  tags: Array<string>
  image?: FlashcardImage | null
}

declare type FlashcardImage = {
  type: 'VideoStillImage'
  id: string
  /** defaults to midpoint */
  seconds?: number
}

declare type PendingClip = {
  start: WaveformX
  end: WaveformX
}

type TimeSpan = {
  start: number
  end: number
}

declare type ClipSpecs = {
  // for export?
  sourceFilePath: string
  outputFilename: string
  /** milliseconds */
  startTime: number
  /** milliseconds */
  endTime: number
  flashcardSpecs: FlashcardSpecs
}
declare type FlashcardSpecs = {
  fields: Array<string>
  tags: Array<string>
  due: number
  image: FlashcardImage | null
}

declare type ApkgExportData = {
  deckName: string
  template: ApkgExportTemplate
  clips: Array<ClipSpecs>
}
declare type ApkgExportTemplate = {
  fields: Array<string> // field names,
  cards: Array<{
    name: string
    questionFormat: string
    answerFormat: string
  }>
  css: string
  sortField: number
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
