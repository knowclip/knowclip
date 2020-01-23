declare type DialogData =
  | ConfirmationDialogData
  | MediaFolderLocationFormDialogData
  | ReviewAndExportDialogData
  | NewProjectFormDialogData
  | FileSelectionDialogData
  | CsvAndMp3ExportDialogData
  | SubtitlesClipsDialogData

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

declare type DialogState = {
  queue: Array<DialogData>
}
