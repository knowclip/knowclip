// @flow

declare type Action =
  | {| type: '@@INIT' |}
  | SnackbarAction
  | DialogAction
  | WaveformAction
  | NoteTypeAction
  | ClipAction
  | {|
      type: 'CHOOSE_AUDIO_FILES',
      filePaths: Array<AudioFilePath>,
      noteTypeId: NoteTypeId,
    |}
  | {| type: 'REMOVE_AUDIO_FILES' |}
  | {|
      type: 'LOAD_AUDIO',
      filePath: ?string,
      audioElement: Object,
      svgElement: Object,
    |}
  | {| type: 'SET_CURRENT_FILE', index: number |}
  | {| type: 'TOGGLE_LOOP' |}
  | {| type: 'LOAD_AUDIO_SUCCESS', file: ?Object |}
  | {| type: 'EXPORT_FLASHCARDS' |}
  | {| type: 'INITIALIZE_APP' |}
  | {| type: 'SET_MEDIA_FOLDER_LOCATION', directoryPath: ?string |}
  | {| type: 'DETECT_SILENCE' |}
  | {| type: 'DETECT_SILENCE_REQUEST' |}
  | {| type: 'DELETE_ALL_CURRENT_FILE_CLIPS_REQUEST' |}
  | {| type: 'HYDRATE_FROM_PROJECT_FILE', state: $Shape<AppState> |}

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
  | {| type: 'ADD_WAVEFORM_SELECTION', selection: Clip |}
  | {|
      type: 'ADD_WAVEFORM_SELECTIONS',
      selections: Array<Clip>,
      filePath: AudioFilePath,
    |}
  | {| type: 'EDIT_WAVEFORM_SELECTION', id: ClipId, override: $Shape<Clip> |}
  | {| type: 'MERGE_WAVEFORM_SELECTIONS', ids: Array<ClipId> |}

declare type NoteTypeAction =
  | { type: 'ADD_NOTE_TYPE', noteType: NoteType }
  | { type: 'EDIT_NOTE_TYPE', id: NoteTypeId, override: $Shape<NoteType> }
  | {
      type: 'EDIT_NOTE_TYPE_REQUEST',
      id: NoteTypeId,
      override: $Shape<NoteType>,
    }
  | { type: 'DELETE_NOTE_TYPE', id: NoteTypeId }
  | { type: 'DELETE_NOTE_TYPE_REQUEST', id: NoteTypeId }
  | { type: 'SET_DEFAULT_NOTE_TYPE', id: NoteTypeId }
  | {
      type: 'SET_AUDIO_FILE_NOTE_TYPE',
      audioFilePath: AudioFilePath,
      noteTypeId: NoteTypeId,
    }
  | {
      type: 'SET_AUDIO_FILE_NOTE_TYPE_REQUEST',
      audioFilePath: AudioFilePath,
      noteTypeId: NoteTypeId,
    }

declare type WaveformAction =
  | {| type: 'SET_WAVEFORM_PEAKS', peaks: Array<*> |}
  | {| type: 'SET_CURSOR_POSITION', x: number, newViewBox: Object |}
  | {| type: 'SET_WAVEFORM_PENDING_SELECTION', selection: Clip |}
  | {| type: 'HIGHLIGHT_WAVEFORM_SELECTION', id: ClipId |}
  | {| type: 'SET_WAVEFORM_PENDING_STRETCH', stretch: PendingStretch |}

declare type DialogAction =
  | {| type: 'ENQUEUE_DIALOG', dialog: DialogData, skipQueue: boolean |}
  | {| type: 'CLOSE_DIALOG' |}

declare type SnackbarAction =
  | {| type: 'ENQUEUE_SNACKBAR', snackbar: SnackbarData |}
  | {| type: 'CLOSE_SNACKBAR' |}
