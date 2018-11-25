// @flow

declare type SnackbarData = {
  type: 'SimpleMessage',
  props: { message: string },
}

declare type SnackbarState = Exact<{
  queue: Array<SnackbarData>,
}>
