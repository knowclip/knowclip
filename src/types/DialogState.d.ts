declare type DialogData =
  | ConfirmationDialogData
  | MediaFolderLocationFormDialogData
  | ReviewAndExportDialogData
  | NewProjectFormDialogData
  | FileSelectionDialogData
  | CsvAndMp3ExportDialogData
  | SubtitlesClipsDialogData
  | ErrorDialogData

declare type ConfirmationDialogData = {
  type: 'Confirmation'
  message: string
  action: Action
  onCancel: Action | null
}

declare type MediaFolderLocationFormDialogData = {
  type: 'MediaFolderLocationForm'
  action: Action | null
}

declare type ReviewAndExportDialogData = {
  type: 'ReviewAndExport'
  mediaOpenPrior: MediaFile | null
  clipIds: ClipId[]
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

  clipIds: Array<ClipId>
}

declare type SubtitlesClipsDialogData = {
  type: 'SubtitlesClips'
}

declare type ErrorDialogData = {
  type: 'Error'
  message: string
  log: string
}

declare type DialogState = {
  queue: Array<DialogData>
}
