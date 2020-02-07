import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Dialog, DialogContent, DialogActions, Button } from '@material-ui/core'
import { closeDialog } from '../../actions'
import { DialogProps } from './DialogProps'
import css from './ErrorDialog.module.css'

const ErrorDialog = ({
  open,
  data: { message, log },
}: DialogProps<ErrorDialogData>) => {
  const dispatch = useDispatch()

  const close = useCallback(
    e => {
      dispatch(closeDialog())
    },
    [dispatch]
  )

  return (
    <Dialog open={open}>
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
