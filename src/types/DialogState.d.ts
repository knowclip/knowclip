declare type DialogData =
  | {
      type: 'Confirmation'
      props: {
        message: string
        action: Action
        onCancel: Action | null
      }
    }
  | {
      type: 'NoteTypeForm'
      props: {
        noteTypeId: NoteTypeId | null
      }
    }
  | {
      type: 'MediaFolderLocationForm'
      props: {
        action: Action | null
      }
    }
  | {
      type: 'ReviewAndExport'
    }
  | {
      type: 'NewProjectForm'
    }
  | {
      type: 'OpenMediaFileFailure'
      props: {
        message: string
      }
    }
  | {
      type: 'FileSelection'
      props: {
        message: string
        fileRecord: FileRecord
      }
    }
  | {
      type: 'CsvAndMp3Export'
      props: {
        clipIds: Array<ClipId>
      }
    }
  | {
      type: 'SubtitlesClips'
    }

declare type DialogState = {
  queue: Array<DialogData>
}
