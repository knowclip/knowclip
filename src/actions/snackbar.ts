import A from '../types/ActionType'
import { compositeDialogActions } from './dialog'

export const snackbarActions = {
  enqueueSnackbar: (snackbar: SnackbarData) => ({
    type: A.enqueueSnackbar as const,
    snackbar,
  }),

  closeSnackbar: () => ({
    type: A.closeSnackbar as const,
  }),
}
const simpleMessageSnackbar = (
  message: string,
  autoHideDuration?: number | null
) =>
  snackbarActions.enqueueSnackbar({
    type: 'SimpleMessage',
    props: { message, autoHideDuration },
  })
const promptSnackbar = (
  message: string,
  actions: [string, Action][],
  autoHideDuration?: number | null
) =>
  snackbarActions.enqueueSnackbar({
    type: 'Prompt',
    props: { message, autoHideDuration, actions },
  })
const activateDictionaryPromptSnackbar = () =>
  promptSnackbar('Activate a dictionary in order to enable word lookup.', [
    [`Dictionary settings`, compositeDialogActions.dictionariesDialog()],
  ])

export const compositeSnackbarActions = {
  simpleMessageSnackbar,
  promptSnackbar,
  activateDictionaryPromptSnackbar,
}
