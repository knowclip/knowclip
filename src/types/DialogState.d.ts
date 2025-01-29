declare type DialogState = {
  queue: Array<DialogData>
}

declare type DialogData =
  | ConfirmationDialogData
  | MediaFolderLocationFormDialogData
  | ReviewAndExportDialogData
  | NewProjectFormDialogData
  | FileSelectionDialogData
  | CsvAndMp3ExportDialogData
  | SubtitlesClipsDialogData
  | ErrorDialogData
  | SettingsDialogData
  | LinkSubtitlesDialogData
  | DictionariesDialogData
  | MediaConversionConfirmationDialogData

declare type ConfirmationDialogData = {
  type: 'Confirmation'
  message: string
  action: Action | Action[]
  onCancel: Action | null
}

declare type MediaFolderLocationFormDialogData = {
  type: 'MediaFolderLocationForm'
  action: Action | null
}

declare type ReviewAndExportDialogData = {
  type: 'ReviewAndExport'
  mediaOpenPrior: MediaFile | null
  mediaFileIdsToClipIds: Record<MediaFileId, Array<ClipId | undefined>>
}

declare type NewProjectFormDialogData = {
  type: 'NewProjectForm'
}

declare type FileSelectionDialogData = {
  type: 'FileSelection'
  message: string
  file: FileMetadata
}

declare type CsvAndMp3ExportDialogData = {
  type: 'CsvAndMp3Export'

  mediaFileIdsToClipIds: Record<MediaFileId, Array<ClipId | undefined>>
}

declare type SubtitlesClipsDialogData = {
  type: 'SubtitlesClips'
}

declare type ErrorDialogData = {
  type: 'Error'
  message: string
  log: string
}

declare type SettingsDialogData = {
  type: 'Settings'
}

declare type LinkSubtitlesDialogData = {
  type: 'LinkSubtitles'
  subtitles: ExternalSubtitlesFile | VttFromEmbeddedSubtitles
  subtitlesChunks: SubtitlesChunk[]
  mediaFileId: MediaFileId
  triggeredOnOpenFile: boolean
}

declare type DictionariesDialogData = {
  type: 'Dictionaries'
}

declare type MediaConversionConfirmationDialogData = {
  type: 'MediaConversionConfirmation'
  message: string
  action: Action
  onCancel: Action | null
}
