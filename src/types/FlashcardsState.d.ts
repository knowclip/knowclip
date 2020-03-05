declare type FlashcardsState = Record<ClipId, Flashcard>

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
  cloze: ClozeDeletion[]
}
declare type TransliterationFlashcard = {
  id: ClipId
  type: 'Transliteration'
  fields: import('./Project').TransliterationFlashcardFields
  tags: Array<string>
  image?: FlashcardImage | null
  cloze: ClozeDeletion[]
}

declare type FlashcardImage = {
  type: 'VideoStillImage'
  id: string
  /** defaults to midpoint */
  seconds?: number
}

declare type ClozeDeletion = {
  ranges: ClozeRange[]
}

declare type ClozeRange = { start: number; end: number }
