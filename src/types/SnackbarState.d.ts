declare type SnackbarData = {
  type: 'SimpleMessage'
  props: {
    message: string
    autoHideDuration?: number | null
  }
}

declare type SnackbarState = {
  queue: Array<SnackbarData>
}
