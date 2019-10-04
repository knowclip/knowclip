// @flow

declare type Action =
  | { type: '@@INIT' }
  | SnackbarAction
  | DialogAction
  | WaveformAction
  | ClipAction
  | ProjectAction
  | MediaAction
  | SubtitlesAction
  | {
      type: 'CHOOSE_AUDIO_FILES'
      filePaths: Array<MediaFilePath>
      ids: Array<MediaFileId>
      noteTypeId: NoteTypeId
    }
  | { type: 'REMOVE_AUDIO_FILES' }
  | { type: 'SET_CURRENT_FILE'; index: number }
  | { type: 'TOGGLE_LOOP' }
  | { type: 'SET_LOOP'; loop: boolean }
  | { type: 'INITIALIZE_APP' }
  | { type: 'SET_MEDIA_FOLDER_LOCATION'; directoryPath: string | null }
  | { type: 'DETECT_SILENCE' }
  | { type: 'DETECT_SILENCE_REQUEST' }
  | { type: 'DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST' }
  | { type: 'SET_ALL_TAGS'; tagsToClipIds: { [tag: string]: Array<ClipId> } }

declare type ClipAction =
  | { type: 'DELETE_CARD'; id: ClipId }
  | { type: 'DELETE_CARDS'; ids: Array<ClipId> }
  | {
      type: 'SET_FLASHCARD_FIELD'
      id: ClipId
      key: string
      value: string
    }
  | {
      type: 'ADD_FLASHCARD_TAG'
      id: ClipId
      text: string
    }
  | {
      type: 'DELETE_FLASHCARD_TAG'
      id: ClipId
      index: number
      tag: string
    }
  | { type: 'SET_DEFAULT_TAGS'; tags: Array<string> }
  | { type: 'ADD_CLIP'; clip: Clip }
  | {
      type: 'ADD_CLIPS'
      clips: Array<Clip>
      fileId: MediaFileId
    }
  | { type: 'EDIT_CLIP'; id: ClipId; override: Partial<Clip> }
  | { type: 'MERGE_CLIPS'; ids: Array<ClipId> }
  | { type: 'HIGHLIGHT_CLIP'; id: ClipId | null }

declare type WaveformAction =
  | SetWaveformImagePath
  | SetCursorPosition
  | SetWaveformViewBox
  | SetPendingClip
  | ClearPendingClip
  | SetPendingStretch
  | ClearPendingStretch
  | WaveformMousedown
declare type SetWaveformImagePath = {
  type: 'SET_WAVEFORM_IMAGE_PATH'
  path: string | null
}
declare type SetCursorPosition = {
  type: 'SET_CURSOR_POSITION'
  x: number
  newViewBox: WaveformViewBox | null
}
declare type SetWaveformViewBox = {
  type: 'SET_WAVEFORM_VIEW_BOX'
  viewBox: WaveformViewBox
}
declare type SetPendingClip = { type: 'SET_PENDING_CLIP'; clip: PendingClip }
declare type ClearPendingClip = {
  type: 'CLEAR_PENDING_CLIP'
}
declare type SetPendingStretch = {
  type: 'SET_PENDING_STRETCH'
  stretch: PendingStretch
}
declare type ClearPendingStretch = {
  type: 'CLEAR_PENDING_STRETCH'
}
declare type WaveformMousedown = {
  type: 'WAVEFORM_MOUSEDOWN'
  x: number
}

declare type DialogAction =
  | { type: 'ENQUEUE_DIALOG'; dialog: DialogData; skipQueue: boolean }
  | { type: 'CLOSE_DIALOG' }

declare type SnackbarAction =
  | { type: 'ENQUEUE_SNACKBAR'; snackbar: SnackbarData }
  | { type: 'CLOSE_SNACKBAR' }

declare type ProjectAction =
  | { type: 'OPEN_PROJECT_REQUEST_BY_ID'; id: ProjectId }
  | { type: 'OPEN_PROJECT_REQUEST_BY_FILE_PATH'; filePath: ProjectFilePath }
  | {
      type: 'OPEN_PROJECT'
      project: Project3_0_0
      projectMetadata: ProjectMetadata
    }
  | {
      type: 'CREATE_PROJECT'
      projectMetadata: ProjectMetadata
    }
  | { type: 'REMOVE_PROJECT_FROM_RECENTS'; id: ProjectId }
  | { type: 'SET_PROJECT_ERROR'; error: string | null }
  | { type: 'SET_PROJECT_NAME'; id: ProjectId; name: string }
  | { type: 'CLOSE_PROJECT' }
  | { type: 'CLOSE_PROJECT_REQUEST' }
  | { type: 'SAVE_PROJECT_REQUEST' }
  | { type: 'SAVE_PROJECT_AS_REQUEST' }
  | { type: 'EXPORT_MP3'; exportData: ApkgExportData }
  | { type: 'EXPORT_APKG_REQUEST'; clipIds: Array<ClipId> }
  | { type: 'EXPORT_APKG_FAILURE'; errorMessage: string | null }
  | { type: 'EXPORT_APKG_SUCCESS'; successMessage: string }
  | { type: 'EXPORT_MARKDOWN'; clipIds: Array<ClipId> }
  | {
      type: 'EXPORT_CSV'
      clipIds: Array<ClipId>
      csvFilePath: string
      mediaFolderLocation: string
    }

declare type MediaAction =
  | OpenMediaFileRequest
  | OpenMediaFileSuccess
  | OpenMp3Request
  | OpenMediaFileFailure
  | AddMediaToProjectRequest
  | AddMediaToProject
  | DeleteMediaFromProjectRequest
  | DeleteMediaFromProject
  | LocateMediaFileRequest
  | LocateMediaFileSuccess
  | SetWorkIsUnsaved
declare type OpenMediaFileRequest = {
  type: 'OPEN_MEDIA_FILE_REQUEST'
  id: MediaFileId
}
declare type OpenMediaFileSuccess = {
  type: 'OPEN_MEDIA_FILE_SUCCESS'
  filePath: MediaFilePath
  constantBitrateFilePath: MediaFilePath
  metadata: MediaFileMetadata
  projectId: ProjectId
  subtitlesTracksStreamIndexes: Array<number>
}
declare type OpenMediaFileFailure = {
  type: 'OPEN_MEDIA_FILE_FAILURE'
  errorMessage: string
}
declare type OpenMp3Request = {
  type: 'OPEN_MP3_REQUEST'
  id: MediaFileId
  filePath: MediaFilePath
}
declare type AddMediaToProjectRequest = {
  type: 'ADD_MEDIA_TO_PROJECT_REQUEST'
  projectId: ProjectId
  filePaths: Array<MediaFilePath>
}
declare type AddMediaToProject = {
  type: 'ADD_MEDIA_TO_PROJECT'
  projectId: ProjectId
  mediaFilePaths: Array<AudioMetadataAndPath>
}
declare type DeleteMediaFromProjectRequest = {
  type: 'DELETE_MEDIA_FROM_PROJECT_REQUEST'
  projectId: ProjectId
  mediaFileId: MediaFileId
}
declare type DeleteMediaFromProject = {
  type: 'DELETE_MEDIA_FROM_PROJECT'
  projectId: ProjectId
  mediaFileId: MediaFileId
}

declare type LocateMediaFileRequest = {
  type: 'LOCATE_MEDIA_FILE_REQUEST'
  id: MediaFileId
  filePath: MediaFilePath
}
declare type LocateMediaFileSuccess = {
  type: 'LOCATE_MEDIA_FILE_SUCCESS'
  projectId: ProjectId
  id: MediaFileId
  metadata: MediaFileMetadata
  filePath: MediaFilePath
}
declare type SetWorkIsUnsaved = {
  type: 'SET_WORK_IS_UNSAVED'
  workIsUnsaved: boolean
}

declare type SubtitlesAction =
  | LoadSubtitlesFromVideoRequest
  | LoadSubtitlesFromFileRequest
  | LoadExternalSubtitlesSuccess
  | LoadEmbeddedSubtitlesSuccess
  | LoadSubtitlesFailure
  | DeleteSubtitlesTrack
  | ShowSubtitles
  | HideSubtitles
  | MakeClipsFromSubtitles
  | ShowSubtitleSClipsDialogRequest
  | LinkFlashcardFieldToSubtitlesTrack
  | GoToSubtitlesChunk
declare type LoadSubtitlesFromVideoRequest = {
  type: 'LOAD_SUBTITLES_FROM_VIDEO_REQUEST'
  streamIndex: number
}
declare type LoadSubtitlesFromFileRequest = {
  type: 'LOAD_SUBTITLES_FROM_FILE_REQUEST'
  filePath: SubtitlesFilePath
}
declare type LoadExternalSubtitlesSuccess = {
  type: 'LOAD_EXTERNAL_SUBTITLES_SUCCESS'
  subtitlesTracks: Array<ExternalSubtitlesTrack>
}
declare type LoadEmbeddedSubtitlesSuccess = {
  type: 'LOAD_EMBEDDED_SUBTITLES_SUCCESS'
  subtitlesTracks: Array<EmbeddedSubtitlesTrack>
}
declare type LoadSubtitlesFailure = {
  type: 'LOAD_SUBTITLES_FAILURE'
  error: string
}
declare type DeleteSubtitlesTrack = {
  type: 'DELETE_SUBTITLES_TRACK'
  id: SubtitlesTrackId
}
declare type ShowSubtitles = { type: 'SHOW_SUBTITLES'; id: SubtitlesTrackId }
declare type HideSubtitles = { type: 'HIDE_SUBTITLES'; id: SubtitlesTrackId }
declare type MakeClipsFromSubtitles = {
  type: 'MAKE_CLIPS_FROM_SUBTITLES'
  fileId: MediaFileId
  fieldNamesToTrackIds: { [K in FlashcardFieldName]: SubtitlesTrackId }
  tags: Array<string>
}
declare type ShowSubtitleSClipsDialogRequest = {
  type: 'SHOW_SUBTITLES_CLIPS_DIALOG_REQUEST'
}
declare type LinkFlashcardFieldToSubtitlesTrack = {
  type: 'LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK'
  flashcardFieldName: FlashcardFieldName
  subtitlesTrackId: SubtitlesTrackId
}
declare type GoToSubtitlesChunk = {
  type: 'GO_TO_SUBTITLES_CHUNK'
  subtitlesTrackId: SubtitlesTrackId
  chunkIndex: number
}
