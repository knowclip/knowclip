// @flow

declare type DialogData = {
  type: 'Confirmation',
  props: { message: string, action: AppAction },
}

declare type DialogState = Exact<{
  queue: Array<DialogData>,
}>
