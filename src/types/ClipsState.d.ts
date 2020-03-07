declare type WaveformX = number

declare type ClipId = string

declare type Clip = {
  id: ClipId
  start: WaveformX
  end: WaveformX
  fileId: MediaFileId
  linkedSubtitlesChunk?: number
}

declare type ClipsState = {
  byId: Record<ClipId, Clip>
  idsByMediaFileId: Record<MediaFileId, ClipId[]>
  flashcards: FlashcardsState
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
  id: string
  fields: Array<string>
  tags: string
  image: FlashcardImage | null
  clozeDeletions?: string
}

declare type ApkgExportData = {
  deckName: string
  projectId: number
  noteModelId: number
  clozeModelId: number
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
