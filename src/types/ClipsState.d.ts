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
  byId: Record<ClipId, Clip>
  idsByMediaFileId: Record<MediaFileId, ClipId[]>
}

declare type FlashcardFields =
  | SimpleFlashcardFields
  | TransliterationFlashcardFields

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
  fields: SimpleFlashcardFields
  tags: Array<string>
  image?: FlashcardImage
}
declare type TransliterationFlashcard = {
  id: ClipId
  type: 'Transliteration'
  fields: TransliterationFlashcardFields
  tags: Array<string>
  image?: FlashcardImage
}
declare type SimpleFlashcardFields = Record<SimpleFlashcardFieldName, string>
declare type TransliterationFlashcardFields = Record<
  TransliterationFlashcardFieldName,
  string
>
declare type FlashcardImage = {
  type: 'VideoStillImage'
  id: string
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
  startTime: number
  endTime: number
  flashcardSpecs: FlashcardSpecs
}
declare type FlashcardSpecs = {
  fields: Array<string>
  tags: Array<string>
  due: number
  sortField: string
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
