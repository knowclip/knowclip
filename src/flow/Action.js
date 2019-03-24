// @flow

declare type Action =
  | {| type: '@@INIT' |}
  | SnackbarAction
  | DialogAction
  | WaveformAction
  | NoteTypeAction
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
  | {| type: 'EXPORT_FLASHCARDS' |}
  | {| type: 'INITIALIZE_APP' |}
  | {| type: 'SET_MEDIA_FOLDER_LOCATION', directoryPath: ?string |}
  | {| type: 'DETECT_SILENCE' |}
  | {| type: 'DETECT_SILENCE_REQUEST' |}
  | {| type: 'DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST' |}

declare type ExportFormat = 'CSV+MP3' | 'APKG'

declare type ClipAction =
  | {| type: 'DELETE_CARD', id: ClipId |}
  | {| type: 'MAKE_CLIPS', format: ExportFormat |}
  | {| type: 'DELETE_CARDS', ids: Array<ClipId> |}
  | {|
      type: 'SET_FLASHCARD_FIELD',
      id: ClipId,
      key: string,
      value: string,
    |}
  | {|
      type: 'SET_FLASHCARD_TAGS_TEXT',
      id: ClipId,
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

declare type NoteTypeAction =
  | {| type: 'ADD_NOTE_TYPE', noteType: NoteType |}
  | {| type: 'EDIT_NOTE_TYPE', id: NoteTypeId, override: $Shape<NoteType> |}
  | {
      type: 'EDIT_NOTE_TYPE_REQUEST',
      id: NoteTypeId,
      override: $Shape<NoteType>,
    }
  | {|
      type: 'DELETE_NOTE_TYPE',
      id: NoteTypeId,
      closeDialogOnComplete: boolean,
    |}
  | {|
      type: 'DELETE_NOTE_TYPE_REQUEST',
      id: NoteTypeId,
      closeDialogOnComplete: boolean,
    |}
  | {
      type: 'SET_AUDIO_FILE_NOTE_TYPE',
      mediaFileId: MediaFileId,
      noteTypeId: NoteTypeId,
    }
  | {|
      type: 'SET_AUDIO_FILE_NOTE_TYPE_REQUEST',
      mediaFileId: MediaFileId,
      noteTypeId: NoteTypeId,
    |}

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
  // tries to load project file using stored path
  | {| type: 'OPEN_PROJECT_REQUEST_BY_ID', id: ProjectId |}
    // tries to load project file using path
    | {| type: 'OPEN_PROJECT_REQUEST_BY_FILE_PATH', filePath: ProjectFilePath |}
    // opens project already loaded from file
    //    syncs project metadata (in redux an local storage)
    | {|
        type: 'OPEN_PROJECT',
        project: Project2_0_0,
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

declare type MediaAction =
  | {| type: 'OPEN_MEDIA_FILE_REQUEST', id: MediaFileId |}
  | {|
      type: 'OPEN_MEDIA_FILE_SUCCESS',
      filePath: MediaFilePath,
      constantBitrateFilePath: MediaFilePath,
      id: MediaFileId,
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
      type: 'DELETE_MEDIA_FROM_PROJECT',
      projectId: ProjectId,
      mediaFileId: MediaFileId,
    |}
  | {| type: 'SET_MEDIA_METADATA', metadata: MediaFileMetadata |}
