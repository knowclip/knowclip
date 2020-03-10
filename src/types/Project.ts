// *********************** NOTE: **********************
// run `yarn build-schemas` if you change stuff here!
// it will be run before production builds though,
// so probably the worst thing that could happen
// if you forget to do this is that your project files
// won't open during dev.

type NoteType = 'Simple' | 'Transliteration' // TODO: remove this duplication
export type ProjectMetadataJson = {
  name: string
  id: string
  createdAt: string
  noteType: NoteType
  timestamp: string
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

export type SubtitlesJson = EmbeddedSubtitlesJson | ExternalSubtitlesJson
export type EmbeddedSubtitlesJson = {
  type: 'Embedded'
  streamIndex: number
  id: string
  chunksCount: number | null
}
export type ExternalSubtitlesJson = {
  type: 'External'
  name: string
  id: string
  chunksCount: number | null
}

export type ProjectJson<F extends FlashcardFields> = {
  project: {
    name: string
    noteType: NoteType
    timestamp: string
    createdAt: string
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

export type $MediaJson =
  | MediaJson<SimpleFlashcardFields>
  | MediaJson<TransliterationFlashcardFields>
