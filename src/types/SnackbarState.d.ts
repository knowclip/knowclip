declare type SnackbarData = SimpleMessageSnackbarData | PromptSnackbarData

declare type SimpleMessageSnackbarData = {
  type: 'SimpleMessage'
  props: {
    message: string
    autoHideDuration?: number | null
  }
}

declare type PromptSnackbarData = {
  type: 'Prompt'
  props: {
    message: string
    actions: [string, Action][]
    autoHideDuration?: number | null
  }
}

declare type SnackbarState = {
  queue: Array<SnackbarData>
}
