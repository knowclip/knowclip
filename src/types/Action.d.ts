// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare type Action = import('../actions').Action

declare type SetCurrentFile = import('../actions').ActionOf<'setCurrentFile'>
declare type ToggleLoop = import('../actions').ActionOf<'toggleLoop'>
declare type SetLoop = import('../actions').ActionOf<'setLoop'>
declare type PlayMedia = import('../actions').ActionOf<'playMedia'>
declare type PauseMedia = import('../actions').ActionOf<'pauseMedia'>
declare type SetViewMode = import('../actions').ActionOf<'setViewMode'>
declare type DismissMedia = import('../actions').ActionOf<'dismissMedia'>
declare type InitializeApp = import('../actions').ActionOf<'initializeApp'>
declare type QuitApp = import('../actions').ActionOf<'quitApp'>
declare type SetMediaFolderLocation = import('../actions').ActionOf<
  'setMediaFolderLocation'
>
declare type AddAssetsDirectories = import('../actions').ActionOf<
  'addAssetsDirectories'
>
declare type RemoveAssetsDirectories = import('../actions').ActionOf<
  'removeAssetsDirectories'
>
declare type SetCheckForUpdatesAutomatically = import('../actions').ActionOf<
  'setCheckForUpdatesAutomatically'
>
declare type OverrideSettings = import('../actions').ActionOf<
  'overrideSettings'
>
declare type AddActiveDictionary = import('../actions').ActionOf<
  'addActiveDictionary'
>
declare type RemoveActiveDictionary = import('../actions').ActionOf<
  'removeActiveDictionary'
>
declare type DetectSilence = import('../actions').ActionOf<'detectSilence'>
declare type DetectSilenceRequest = import('../actions').ActionOf<
  'detectSilenceRequest'
>
declare type DeleteAllCurrentFileClipsRequest = import('../actions').ActionOf<
  'deleteAllCurrentFileClipsRequest'
>
declare type SetAllTags = import('../actions').ActionOf<'setAllTags'>
declare type SetFlashcardField = import('../actions').ActionOf<
  'setFlashcardField'
>
declare type AddFlashcardTag = import('../actions').ActionOf<'addFlashcardTag'>
declare type DeleteFlashcardTag = import('../actions').ActionOf<
  'deleteFlashcardTag'
>
declare type SetDefaultClipSpecs = import('../actions').ActionOf<
  'setDefaultClipSpecs'
>
declare type AddClip = import('../actions').ActionOf<'addClip'>
declare type AddClips = import('../actions').ActionOf<'addClips'>
declare type EditClip = import('../actions').ActionOf<'editClip'>
declare type EditClips = import('../actions').ActionOf<'editClips'>
declare type MergeClips = import('../actions').ActionOf<'mergeClips'>
declare type DeleteCard = import('../actions').ActionOf<'deleteCard'>
declare type DeleteCards = import('../actions').ActionOf<'deleteCards'>
declare type StartEditingCards = import('../actions').ActionOf<
  'startEditingCards'
>
declare type StopEditingCards = import('../actions').ActionOf<
  'stopEditingCards'
>
declare type OpenDictionaryPopover = import('../actions').ActionOf<
  'openDictionaryPopover'
>
declare type CloseDictionaryPopover = import('../actions').ActionOf<
  'closeDictionaryPopover'
>
declare type NewCardFromSubtitlesRequest = import('../actions').ActionOf<
  'newCardFromSubtitlesRequest'
>
declare type SelectWaveformItem = import('../actions').ActionOf<
  'selectWaveformItem'
>
declare type HighlightLeftClipRequest = import('../actions').ActionOf<
  'highlightLeftClipRequest'
>
declare type HighlightRightClipRequest = import('../actions').ActionOf<
  'highlightRightClipRequest'
>
declare type SetCursorPosition = import('../actions').ActionOf<
  'setCursorPosition'
>
declare type GenerateWaveformImages = import('../actions').ActionOf<
  'generateWaveformImages'
>
declare type EnqueueDialog = import('../actions').ActionOf<'enqueueDialog'>
declare type CloseDialog = import('../actions').ActionOf<'closeDialog'>
declare type EnqueueSnackbar = import('../actions').ActionOf<'enqueueSnackbar'>
declare type CloseSnackbar = import('../actions').ActionOf<'closeSnackbar'>
declare type CreateProject = import('../actions').ActionOf<'createProject'>
declare type OpenProjectRequestById = import('../actions').ActionOf<
  'openProjectRequestById'
>
declare type OpenProjectRequestByFilePath = import('../actions').ActionOf<
  'openProjectRequestByFilePath'
>
declare type OpenProject = import('../actions').ActionOf<'openProject'>
declare type SetProjectError = import('../actions').ActionOf<'setProjectError'>
declare type CloseProject = import('../actions').ActionOf<'closeProject'>
declare type CloseProjectRequest = import('../actions').ActionOf<
  'closeProjectRequest'
>
declare type SaveProjectRequest = import('../actions').ActionOf<
  'saveProjectRequest'
>
declare type SaveProjectAsRequest = import('../actions').ActionOf<
  'saveProjectAsRequest'
>
declare type ExportApkgRequest = import('../actions').ActionOf<
  'exportApkgRequest'
>
declare type ExportApkgFailure = import('../actions').ActionOf<
  'exportApkgFailure'
>
declare type ExportApkgSuccess = import('../actions').ActionOf<
  'exportApkgSuccess'
>
declare type ExportMarkdown = import('../actions').ActionOf<'exportMarkdown'>
declare type ExportCsv = import('../actions').ActionOf<'exportCsv'>
declare type AddMediaToProjectRequest = import('../actions').ActionOf<
  'addMediaToProjectRequest'
>
declare type SetWorkIsUnsaved = import('../actions').ActionOf<
  'setWorkIsUnsaved'
>
declare type MountSubtitlesTrack = import('../actions').ActionOf<
  'mountSubtitlesTrack'
>
declare type ShowSubtitles = import('../actions').ActionOf<'showSubtitles'>
declare type HideSubtitles = import('../actions').ActionOf<'hideSubtitles'>
declare type MakeClipsFromSubtitles = import('../actions').ActionOf<
  'makeClipsFromSubtitles'
>
declare type ShowSubtitlesClipsDialogRequest = import('../actions').ActionOf<
  'showSubtitlesClipsDialogRequest'
>
declare type LinkFlashcardFieldToSubtitlesTrackRequest = import('../actions').ActionOf<
  'linkFlashcardFieldToSubtitlesTrackRequest'
>
declare type AddFile = import('../actions').ActionOf<'addFile'>
declare type GoToSubtitlesChunk = import('../actions').ActionOf<
  'goToSubtitlesChunk'
>
declare type DeleteFileRequest = import('../actions').ActionOf<
  'deleteFileRequest'
>
declare type DeleteFileSuccess = import('../actions').ActionOf<
  'deleteFileSuccess'
>
declare type OpenFileRequest = import('../actions').ActionOf<'openFileRequest'>
declare type OpenFileSuccess = import('../actions').ActionOf<'openFileSuccess'>
declare type OpenFileFailure = import('../actions').ActionOf<'openFileFailure'>
declare type LocateFileRequest = import('../actions').ActionOf<
  'locateFileRequest'
>
declare type LocateFileSuccess = import('../actions').ActionOf<
  'locateFileSuccess'
>
declare type UpdateFile = import('../actions').ActionOf<'updateFile'>
declare type CommitFileDeletions = import('../actions').ActionOf<
  'commitFileDeletions'
>
declare type AbortFileDeletions = import('../actions').ActionOf<
  'abortFileDeletions'
>
declare type SetProgress = import('../actions').ActionOf<'setProgress'>
declare type PreloadVideoStills = import('../actions').ActionOf<
  'preloadVideoStills'
>
declare type DeleteImportedDictionary = import('../actions').ActionOf<
  'deleteImportedDictionary'
>
declare type ResetDictionariesDatabase = import('../actions').ActionOf<
  'resetDictionariesDatabase'
>
declare type ImportDictionaryRequest = import('../actions').ActionOf<
  'importDictionaryRequest'
>
declare type StartDictionaryImport = import('../actions').ActionOf<
  'startDictionaryImport'
>

declare interface UpdateFileWith<T extends keyof FileUpdates> {
  type: 'updateFile'
  update: FileUpdate<T>
}
