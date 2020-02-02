declare type ProjectId = string

declare type ProjectJson<F extends FlashcardFields> = {
  name: string
  noteType: NoteType
  media: MediaJson<F>[]

  timestamp: string
  id: ProjectId
}

declare type MediaJson<F extends FlashcardFields> =
  | {
      name: MediaFileName
      subtitles?: Array<SubtitlesJson>
      clips?: ClipJson<F>[]
      flashcardFieldsToSubtitlesTracks?: SubtitlesFlashcardFieldsLinks

      format: 'UNKNOWN' | string
      duration: string
      id: FileId
    }
  | {
      name: MediaFileName
      subtitles?: Array<SubtitlesJson>
      flashcardFieldsToSubtitlesTracks?: SubtitlesFlashcardFieldsLinks
      clips?: ClipJson<F>[]

      format: 'UNKNOWN' | string
      width: number
      height: number
      duration: string
      id: FileId
    }

declare type ClipJson<F extends FlashcardFields> = {
  /** must be before start and after end of any previous clips */
  start: string
  end: string
  image?: { type: 'VideoStill'; time?: string }
  fields?: Partial<F>
  tags?: Array<string>

  id: ClipId
}

declare type SubtitlesJson =
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

declare type ProjectYamlDocuments<F extends FlashcardFields> = {
  project: {
    name: string
    noteType: NoteType
    timestamp: string
    id: ProjectId
  }
  media: MediaJson<F>[]
}

type NormalizedProjectFileData = {
  project: ProjectFile
  media: MediaFile[]
  clips: Clip[]
  // subtitles: SubtitlesFile[]
}
