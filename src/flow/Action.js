// @flow

declare type Action =
  | {| type: '@@INIT' |}
  | SnackbarAction
  | DialogAction
  | WaveformAction
  | ClipAction
  | ProjectAction
  | MediaAction
  | {|
      type: 'CHOOSE_AUDIO_FILES',
      filePaths: Array<MediaFilePath>,
      ids: Array<MediaFileId>,
      noteTypeId: NoteTypeId,
    |}
  | {| type: 'REMOVE_AUDIO_FILES' |}
  | {| type: 'SET_CURRENT_FILE', index: number |}
  | {| type: 'TOGGLE_LOOP' |}
  | {| type: 'SET_LOOP', loop: boolean |}
  | {| type: 'INITIALIZE_APP' |}
  | {| type: 'SET_MEDIA_FOLDER_LOCATION', directoryPath: ?string |}
  | {| type: 'DETECT_SILENCE' |}
  | {| type: 'DETECT_SILENCE_REQUEST' |}
  | {| type: 'DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST' |}
  | {| type: 'SET_ALL_TAGS', tagsToClipIds: { [string]: Array<ClipId> } |}

declare type ClipAction =
  | {| type: 'DELETE_CARD', id: ClipId |}
  | {| type: 'DELETE_CARDS', ids: Array<ClipId> |}
  | {|
      type: 'SET_FLASHCARD_FIELD',
      id: ClipId,
      key: string,
      value: string,
    |}
  | {|
      type: 'ADD_FLASHCARD_TAG',
      id: ClipId,
      text: string,
    |}
  | {|
      type: 'DELETE_FLASHCARD_TAG',
      id: ClipId,
      index: number,
      tag: string,
    |}
  | {| type: 'SET_DEFAULT_TAGS', tags: Array<string> |}
  | {| type: 'ADD_CLIP', clip: Clip |}
  | {|
      type: 'ADD_CLIPS',
      clips: Array<Clip>,
      fileId: MediaFileId,
    |}
  | {| type: 'EDIT_CLIP', id: ClipId, override: $Shape<Clip> |}
  | {| type: 'MERGE_CLIPS', ids: Array<ClipId> |}
  | {| type: 'HIGHLIGHT_CLIP', id: ?ClipId |}

declare type WaveformAction =
  | {| type: 'SET_WAVEFORM_IMAGE_PATH', path: ?string |}
  | {| type: 'SET_CURSOR_POSITION', x: number, newViewBox: Object |}
  | {| type: 'SET_WAVEFORM_VIEW_BOX', viewBox: WaveformViewBox |}
  | {| type: 'SET_PENDING_CLIP', clip: ?PendingClip |}
  | {| type: 'SET_PENDING_STRETCH', stretch: PendingStretch |}

declare type DialogAction =
  | {| type: 'ENQUEUE_DIALOG', dialog: DialogData, skipQueue: boolean |}
  | {| type: 'CLOSE_DIALOG' |}

declare type SnackbarAction =
  | {| type: 'ENQUEUE_SNACKBAR', snackbar: SnackbarData |}
  | {| type: 'CLOSE_SNACKBAR' |}

declare type ProjectAction =
  | {| type: 'OPEN_PROJECT_REQUEST_BY_ID', id: ProjectId |}
  | {| type: 'OPEN_PROJECT_REQUEST_BY_FILE_PATH', filePath: ProjectFilePath |}
  | {|
      type: 'OPEN_PROJECT',
      project: Project3_0_0,
      projectMetadata: ProjectMetadata,
    |}
  | {|
      type: 'CREATE_PROJECT',
      projectMetadata: ProjectMetadata,
      noteType: NoteType,
    |}
  | {| type: 'REMOVE_PROJECT_FROM_RECENTS', id: ProjectId |}
  | {| type: 'SET_PROJECT_ERROR', error: ?string |}
  | {| type: 'SET_PROJECT_NAME', id: ProjectId, name: string |}
  | {| type: 'CLOSE_PROJECT' |}
  | {| type: 'CLOSE_PROJECT_REQUEST' |}
  | {| type: 'SAVE_PROJECT_REQUEST' |}
  | {| type: 'SAVE_PROJECT_AS_REQUEST' |}
  | {| type: 'EXPORT_MP3', exportData: ApkgExportData |}
  | {| type: 'EXPORT_APKG_REQUEST', clipIds: Array<ClipId> |}
  | {| type: 'EXPORT_APKG_FAILURE', errorMessage: ?string |}
  | {| type: 'EXPORT_APKG_SUCCESS', successMessage: string |}
  | {| type: 'EXPORT_MARKDOWN', clipIds: Array<ClipId> |}
  | {| type: 'EXPORT_CSV', clipIds: Array<ClipId> |}
declare type MediaAction =
  | {| type: 'OPEN_MEDIA_FILE_REQUEST', id: MediaFileId |}
  | {|
      type: 'OPEN_MEDIA_FILE_SUCCESS',
      filePath: MediaFilePath,
      constantBitrateFilePath: MediaFilePath,
      metadata: MediaFileMetadata,
      projectId: ProjectId,
    |}
  | {| type: 'OPEN_MEDIA_FILE_FAILURE', errorMessage: string |}
  | {|
      type: 'ADD_MEDIA_TO_PROJECT_REQUEST',
      projectId: ProjectId,
      filePaths: Array<MediaFilePath>,
    |}
  | {|
      type: 'ADD_MEDIA_TO_PROJECT',
      projectId: ProjectId,
      mediaFilePaths: Array<AudioMetadataAndPath>,
    |}
  | {|
      type: 'DELETE_MEDIA_FROM_PROJECT_REQUEST',
      projectId: ProjectId,
      mediaFileId: MediaFileId,
    |}
  | {|
      type: 'DELETE_MEDIA_FROM_PROJECT',
      projectId: ProjectId,
      mediaFileId: MediaFileId,
    |}
  | {|
      type: 'LOCATE_MEDIA_FILE_REQUEST',
      id: MediaFileId,
      filePath: MediaFilePath,
    |}
  | {|
      type: 'LOCATE_MEDIA_FILE_SUCCESS',
      projectId: ProjectId,
      id: MediaFileId,
      metadata: MediaFileMetadata,
      filePath: MediaFilePath,
    |}
  | {| type: 'SET_WORK_IS_UNSAVED', workIsUnsaved: boolean |}
