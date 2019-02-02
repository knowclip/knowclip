// @flow

declare type DialogData =
  | {
      type: 'Confirmation',
      props: { message: string, action: AppAction },
    }
  | {
      type: 'NoteTypeForm',
      props: { noteTypeId: ?NoteTypeId },
    }
  | {
      type: 'MediaFolderLocationForm',
      props: { action: ?AppAction },
    }

declare type DialogState = Exact<{
  queue: Array<DialogData>,
}>
