import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Dialog, DialogContent, DialogActions, Button } from '@material-ui/core'
import { closeDialog } from '../../actions'
import { DialogProps } from './DialogProps'

const ConfirmationDialog = ({
  open,
  data: { message, action, onCancel },
}: DialogProps<ConfirmationDialogData>) => {
  const dispatch = useDispatch()

  const dispatchAction = useCallback(
    e => {
      dispatch(action)
      dispatch(closeDialog())
    },
    [dispatch, action]
  )

  const cancel = useCallback(
    e => {
      onCancel && dispatch(onCancel)
      dispatch(closeDialog())
    },
    [dispatch, onCancel]
  )

  return (
    <Dialog open={open}>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
        <Button onClick={cancel}>Cancel</Button>
        <Button onClick={dispatchAction}>Ok</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmationDialog
