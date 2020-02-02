declare type ProjectId = string

declare type SlimProject<F extends FlashcardFields> = {
  name: string
  noteType: NoteType
  media: ProjectMediaFile<F>[]

  timestamp: string
  id: ProjectId
}

declare type ProjectMediaFile<F extends FlashcardFields> =
  | {
      name: MediaFileName
      subtitles?: Array<ProjectSubtitles>
      clips?: ProjectClip<F>[]
      flashcardFieldsToSubtitlesTracks?: SubtitlesFlashcardFieldsLinks

      format: 'UNKNOWN' | string
      duration: string
      id: FileId
    }
  | {
      name: MediaFileName
      subtitles?: Array<ProjectSubtitles>
      flashcardFieldsToSubtitlesTracks?: SubtitlesFlashcardFieldsLinks
      clips?: ProjectClip<F>[]

      format: 'UNKNOWN' | string
      width: number
      height: number
      duration: string
      id: FileId
    }

declare type ProjectClip<F extends FlashcardFields> = {
  /** must be before start and after end of any previous clips */
  start: string
  end: string
  image?: { type: 'VideoStill'; time?: string }
  fields?: Partial<F>
  tags?: Array<string>

  id: ClipId
}

declare type ProjectSubtitles =
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
  media: ProjectMediaFile<F>[]
}

type NormalizedProjectFileData = {
  project: ProjectFile
  media: MediaFile[]
  clips: Clip[]
  // subtitles: SubtitlesFile[]
}
