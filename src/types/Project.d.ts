declare type Project =
  | Project0_0_0
  | Project1_0_0
  | Project2_0_0
  | Project3_0_0
  | Project4_0_0
  | Project4_1_0

declare type ProjectId = string

declare type Project0_0_0 = {
  version: '0.0.0'
  audioFileName: MediaFileName
  noteType: NoteTypePre3_0_0
  clips: Record<ClipId, ClipWithoutFilePath>
}

declare type Project1_0_0 = {
  version: '1.0.0'
  audioFileName: MediaFileName
  audioFileId: MediaFileId
  noteType: NoteTypePre3_0_0
  clips: Record<ClipId, ClipPre3_0_0>
}

declare type Project2_0_0 = {
  version: '2.0.0'
  id: ProjectId
  name: string
  mediaFilesMetadata: Array<MediaFileMetadata_Pre_4>
  noteType: NoteTypePre3_0_0
  clips: Record<ClipId, ClipPre3_0_0>
  tags: Array<string>
  timestamp: string
}

declare type Project3_0_0 = {
  version: '3.0.0'
  id: ProjectId
  name: string
  mediaFilesMetadata: Array<MediaFileMetadata_Pre_4>
  noteType: NoteType
  clips: Record<ClipId, Clip>
  tags: Array<string>
  timestamp: string
}

declare type Project4_0_0 = {
  version: '4.0.0'
  id: ProjectId
  name: string
  mediaFilesMetadata: Array<MediaFileMetadata>
  noteType: NoteType
  clips: Array<Clip>
  tags: Array<string> // maybe shouldnt be saved here
  timestamp: string
}

declare type Project4_1_0 = {
  version: '4.1.0'
  id: ProjectId
  name: string
  mediaFiles: Array<MediaFile>
  noteType: NoteType
  clips: Array<Clip>
  tags: Array<string> // maybe shouldnt be saved here
  timestamp: string
  lastOpened: string
  subtitles: Array<ExternalSubtitlesFile>
}

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
      clips: ProjectClip<F>[]
      flashcardFieldsToSubtitlesTracks?: SubtitlesFlashcardFieldsLinks

      format: 'UNKNOWN' | string
      durationSeconds: number
      // subtitlesTracksStreamIndexes?: number[]
      id: FileId
    }
  | {
      name: MediaFileName
      subtitles?: Array<ProjectSubtitles>
      flashcardFieldsToSubtitlesTracks?: SubtitlesFlashcardFieldsLinks
      clips: ProjectClip<F>[]

      format: 'UNKNOWN' | string
      width: number
      height: number
      durationSeconds: number
      // subtitlesTracksStreamIndexes?: number[]
      id: FileId
    }

declare type ProjectClip<F extends FlashcardFields> = {
  /** must be before start and after end of any previous clips */
  start: WaveformX
  end: WaveformX
  image?: { type: 'VideoStill'; seconds?: number }
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
