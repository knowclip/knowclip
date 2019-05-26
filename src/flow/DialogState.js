// @flow

declare type DialogData =
  | {
      type: 'Confirmation',
      props: { message: string, action: Action },
    }
  | {
      type: 'NoteTypeForm',
      props: { noteTypeId: ?NoteTypeId },
    }
  | {
      type: 'MediaFolderLocationForm',
      props: { action: ?Action },
    }
  | {
      type: 'ReviewAndExport',
    }
  | {
      type: 'NewProjectForm',
    }
  | {
      type: 'OpenMediaFileFailure',
      props: { message: string },
    }
  | {
      type: 'CsvAndMp3Export',
      props: { clipIds: Array<ClipId> },
    }
declare type DialogState = Exact<{
  queue: Array<DialogData>,
}>
