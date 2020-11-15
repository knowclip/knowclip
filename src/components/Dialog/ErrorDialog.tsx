import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Dialog, DialogContent, DialogActions, Button } from '@material-ui/core'
import { DialogProps } from './DialogProps'
import css from './ErrorDialog.module.css'
import { actions } from '../../actions'

const ErrorDialog = ({
  open,
  data: { message, log },
}: DialogProps<ErrorDialogData>) => {
  const dispatch = useDispatch()

  const close = useCallback(
    (e) => {
      dispatch(actions.closeDialog())
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
