import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Dialog, DialogContent, DialogActions, Button } from '@mui/material'
import { DialogProps } from './DialogProps'
import css from './ErrorDialog.module.css'
import { actions } from '../../actions'

enum $ {
  container = 'error-dialog',
}
export { $ as errorDialog$ }

const ErrorDialog = ({
  open,
  data: { message, log },
}: DialogProps<ErrorDialogData>) => {
  const dispatch = useDispatch()

  const close = useCallback(() => {
    dispatch(actions.closeDialog())
  }, [dispatch])

  return (
    <Dialog open={open} className={$.container}>
      <DialogContent>
        <p>{message}</p>

        <p className={css.log}>{log}</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ErrorDialog
