type NoteType = 'Simple' | 'Transliteration' // duplicated

export type ProjectMetadataJson<F extends FlashcardFields> = {
  name: string
  noteType: NoteType
  // media: MediaJson<F>[]

  timestamp: string
  id: string
}

export type MediaJson<F extends FlashcardFields> =
  | {
      name: string
      subtitles?: Array<SubtitlesJson>
      clips?: ClipJson<F>[]
      flashcardFieldsToSubtitlesTracks?: SubtitlesFlashcardFieldsLinks

      format: 'UNKNOWN' | string
      duration: string
      id: string
    }
  | {
      name: string
      subtitles?: Array<SubtitlesJson>
      flashcardFieldsToSubtitlesTracks?: SubtitlesFlashcardFieldsLinks
      clips?: ClipJson<F>[]

      format: 'UNKNOWN' | string
      width: number
      height: number
      duration: string
      id: string
    }

export type ClipJson<F extends FlashcardFields> = {
  /** must be before start and after end of any previous clips */
  start: string
  end: string
  image?: { type: 'VideoStill'; time?: string }
  fields?: Partial<F>
  tags?: Array<string>

  id: string
}

export type SubtitlesJson =
  | {
      type: 'Embedded'
      streamIndex: number
      id: string
    }
  | {
      type: 'External'
      name: string
      id: string
    }

export type ProjectJson<F extends FlashcardFields> = {
  project: {
    name: string
    noteType: NoteType
    timestamp: string
    id: string
  }
  media: MediaJson<F>[]
}

export type SubtitlesFlashcardFieldsLinks = Partial<
  Record<
    'transcription' | 'pronunciation' | 'meaning' | 'notes',
    string // subtitles track id
  >
>

export type SimpleFlashcardFields = Record<
  'transcription' | 'meaning' | 'notes',
  string
>
export type TransliterationFlashcardFields = Record<
  'transcription' | 'pronunciation' | 'meaning' | 'notes',
  string
>

export type FlashcardFields =
  | SimpleFlashcardFields
  | TransliterationFlashcardFields

export type $ProjectMetadataJson =
  | ProjectMetadataJson<SimpleFlashcardFields>
  | ProjectMetadataJson<TransliterationFlashcardFields>

export type $MediaJson =
  | MediaJson<SimpleFlashcardFields>
  | MediaJson<TransliterationFlashcardFields>
