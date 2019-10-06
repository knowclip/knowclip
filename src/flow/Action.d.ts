declare type Action =
  | { type: A.INIT }
  | SnackbarAction
  | DialogAction
  | WaveformAction
  | ClipAction
  | ProjectAction
  | MediaAction
  | SubtitlesAction
  | {
      type: A.CHOOSE_AUDIO_FILES
      filePaths: Array<MediaFilePath>
      ids: Array<MediaFileId>
      noteTypeId: NoteTypeId
    }
  | { type: A.REMOVE_AUDIO_FILES }
  | { type: A.SET_CURRENT_FILE; index: number }
  | { type: A.TOGGLE_LOOP }
  | { type: A.SET_LOOP; loop: boolean }
  | { type: A.INITIALIZE_APP }
  | { type: A.SET_MEDIA_FOLDER_LOCATION; directoryPath: string | null }
  | DetectSilence
  | DetectSilenceRequest
  | DeleteAllCurrentFileClipsRequest
  | SetAllTags

declare type DetectSilence = { type: A.DETECT_SILENCE }

declare type DetectSilenceRequest = { type: A.DETECT_SILENCE_REQUEST }
declare type DeleteAllCurrentFileClipsRequest = {
  type: A.DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST
}
declare type SetAllTags = {
  type: A.SET_ALL_TAGS
  tagsToClipIds: { [tag: string]: Array<ClipId> }
}

declare type ClipAction =
  | DeleteCard
  | DeleteCards
  | SetFlashcardField
  | AddFlashcardTag
  | DeleteFlashcardTag
  | SetDefaultTags
  | AddClip
  | AddClips
  | EditClip
  | MergeClips
  | HighlightClip

declare type DeleteCard = { type: A.DELETE_CARD; id: ClipId }
declare type DeleteCards = { type: A.DELETE_CARDS; ids: Array<ClipId> }
declare type SetFlashcardField = {
  type: A.SET_FLASHCARD_FIELD
  id: ClipId
  key: string
  value: string
}
declare type AddFlashcardTag = {
  type: A.ADD_FLASHCARD_TAG
  id: ClipId
  text: string
}
declare type DeleteFlashcardTag = {
  type: A.DELETE_FLASHCARD_TAG
  id: ClipId
  index: number
  tag: string
}
declare type SetDefaultTags = { type: A.SET_DEFAULT_TAGS; tags: Array<string> }
declare type AddClip = { type: A.ADD_CLIP; clip: Clip }
declare type AddClips = {
  type: A.ADD_CLIPS
  clips: Array<Clip>
  fileId: MediaFileId
}
declare type EditClip = {
  type: A.EDIT_CLIP
  id: ClipId
  override: Partial<Clip>
}
declare type MergeClips = { type: A.MERGE_CLIPS; ids: Array<ClipId> }
declare type HighlightClip = { type: A.HIGHLIGHT_CLIP; id: ClipId | null }

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
  type: A.SET_WAVEFORM_IMAGE_PATH
  path: string | null
}
declare type SetCursorPosition = {
  type: A.SET_CURSOR_POSITION
  x: number
  newViewBox: WaveformViewBox | null
}
declare type SetWaveformViewBox = {
  type: A.SET_WAVEFORM_VIEW_BOX
  viewBox: WaveformViewBox
}
declare type SetPendingClip = { type: A.SET_PENDING_CLIP; clip: PendingClip }
declare type ClearPendingClip = {
  type: A.CLEAR_PENDING_CLIP
}
declare type SetPendingStretch = {
  type: A.SET_PENDING_STRETCH
  stretch: PendingStretch
}
declare type ClearPendingStretch = {
  type: A.CLEAR_PENDING_STRETCH
}
declare type WaveformMousedown = {
  type: A.WAVEFORM_MOUSEDOWN
  x: number
}

declare type DialogAction =
  | { type: A.ENQUEUE_DIALOG; dialog: DialogData; skipQueue: boolean }
  | { type: A.CLOSE_DIALOG }

declare type SnackbarAction =
  | { type: A.ENQUEUE_SNACKBAR; snackbar: SnackbarData }
  | { type: A.CLOSE_SNACKBAR }

declare type ProjectAction =
  | OpenProjectRequestById
  | OpenProjectRequestByFilePath
  | OpenProject
  | CreateProject
  | RemoveProjectFromRecents
  | SetProjectError
  | SetProjectName
  | CloseProject
  | CloseProjectRequest
  | SaveProjectRequest
  | SaveProjectAsRequest
  | ExportMp3
  | ExportApkgRequest
  | ExportApkgFailure
  | ExportApkgSuccess
  | ExportMarkdown
  | ExportCsv

declare type OpenProjectRequestById = {
  type: A.OPEN_PROJECT_REQUEST_BY_ID
  id: ProjectId
}
declare type OpenProjectRequestByFilePath = {
  type: A.OPEN_PROJECT_REQUEST_BY_FILE_PATH
  filePath: ProjectFilePath
}
declare type OpenProject = {
  type: A.OPEN_PROJECT
  project: Project3_0_0
  projectMetadata: ProjectMetadata
}
declare type CreateProject = {
  type: A.CREATE_PROJECT
  projectMetadata: ProjectMetadata
}
declare type RemoveProjectFromRecents = {
  type: A.REMOVE_PROJECT_FROM_RECENTS
  id: ProjectId
}
declare type SetProjectError = {
  type: A.SET_PROJECT_ERROR
  error: string | null
}
declare type SetProjectName = {
  type: A.SET_PROJECT_NAME
  id: ProjectId
  name: string
}
declare type CloseProject = { type: A.CLOSE_PROJECT }
declare type CloseProjectRequest = { type: A.CLOSE_PROJECT_REQUEST }
declare type SaveProjectRequest = { type: A.SAVE_PROJECT_REQUEST }
declare type SaveProjectAsRequest = { type: A.SAVE_PROJECT_AS_REQUEST }
declare type ExportMp3 = { type: A.EXPORT_MP3; exportData: ApkgExportData }
declare type ExportApkgRequest = {
  type: A.EXPORT_APKG_REQUEST
  clipIds: Array<ClipId>
}
declare type ExportApkgFailure = {
  type: A.EXPORT_APKG_FAILURE
  errorMessage: string | null
}
declare type ExportApkgSuccess = {
  type: A.EXPORT_APKG_SUCCESS
  successMessage: string
}
declare type ExportMarkdown = {
  type: A.EXPORT_MARKDOWN
  clipIds: Array<ClipId>
}
declare type ExportCsv = {
  type: A.EXPORT_CSV
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
  type: A.OPEN_MEDIA_FILE_REQUEST
  id: MediaFileId
}
declare type OpenMediaFileSuccess = {
  type: A.OPEN_MEDIA_FILE_SUCCESS
  filePath: MediaFilePath
  constantBitrateFilePath: MediaFilePath
  metadata: MediaFileMetadata
  projectId: ProjectId
  subtitlesTracksStreamIndexes: Array<number>
}
declare type OpenMediaFileFailure = {
  type: A.OPEN_MEDIA_FILE_FAILURE
  errorMessage: string
}
declare type OpenMp3Request = {
  type: A.OPEN_MP3_REQUEST
  id: MediaFileId
  filePath: MediaFilePath
}
declare type AddMediaToProjectRequest = {
  type: A.ADD_MEDIA_TO_PROJECT_REQUEST
  projectId: ProjectId
  filePaths: Array<MediaFilePath>
}
declare type AddMediaToProject = {
  type: A.ADD_MEDIA_TO_PROJECT
  projectId: ProjectId
  mediaFilePaths: Array<AudioMetadataAndPath>
}
declare type DeleteMediaFromProjectRequest = {
  type: A.DELETE_MEDIA_FROM_PROJECT_REQUEST
  projectId: ProjectId
  mediaFileId: MediaFileId
}
declare type DeleteMediaFromProject = {
  type: A.DELETE_MEDIA_FROM_PROJECT
  projectId: ProjectId
  mediaFileId: MediaFileId
}

declare type LocateMediaFileRequest = {
  type: A.LOCATE_MEDIA_FILE_REQUEST
  id: MediaFileId
  filePath: MediaFilePath
}
declare type LocateMediaFileSuccess = {
  type: A.LOCATE_MEDIA_FILE_SUCCESS
  projectId: ProjectId
  id: MediaFileId
  metadata: MediaFileMetadata
  filePath: MediaFilePath
}
declare type SetWorkIsUnsaved = {
  type: A.SET_WORK_IS_UNSAVED
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
  type: A.LOAD_SUBTITLES_FROM_VIDEO_REQUEST
  streamIndex: number
}
declare type LoadSubtitlesFromFileRequest = {
  type: A.LOAD_SUBTITLES_FROM_FILE_REQUEST
  filePath: SubtitlesFilePath
}
declare type LoadExternalSubtitlesSuccess = {
  type: A.LOAD_EXTERNAL_SUBTITLES_SUCCESS
  subtitlesTracks: Array<ExternalSubtitlesTrack>
}
declare type LoadEmbeddedSubtitlesSuccess = {
  type: A.LOAD_EMBEDDED_SUBTITLES_SUCCESS
  subtitlesTracks: Array<EmbeddedSubtitlesTrack>
}
declare type LoadSubtitlesFailure = {
  type: A.LOAD_SUBTITLES_FAILURE
  error: string
}
declare type DeleteSubtitlesTrack = {
  type: A.DELETE_SUBTITLES_TRACK
  id: SubtitlesTrackId
}
declare type ShowSubtitles = { type: A.SHOW_SUBTITLES; id: SubtitlesTrackId }
declare type HideSubtitles = { type: A.HIDE_SUBTITLES; id: SubtitlesTrackId }
declare type MakeClipsFromSubtitles = {
  type: A.MAKE_CLIPS_FROM_SUBTITLES
  fileId: MediaFileId
  fieldNamesToTrackIds: { [K in FlashcardFieldName]: SubtitlesTrackId }
  tags: Array<string>
}
declare type ShowSubtitleSClipsDialogRequest = {
  type: A.SHOW_SUBTITLES_CLIPS_DIALOG_REQUEST
}
declare type LinkFlashcardFieldToSubtitlesTrack = {
  type: A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK
  flashcardFieldName: FlashcardFieldName
  subtitlesTrackId: SubtitlesTrackId
}
declare type GoToSubtitlesChunk = {
  type: A.GO_TO_SUBTITLES_CHUNK
  subtitlesTrackId: SubtitlesTrackId
  chunkIndex: number
}
