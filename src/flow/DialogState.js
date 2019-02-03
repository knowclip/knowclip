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

declare type DialogState = Exact<{
  queue: Array<DialogData>,
}>
