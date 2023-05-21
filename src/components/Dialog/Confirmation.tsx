import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Dialog, DialogContent, DialogActions, Button } from '@mui/material'
import { actions } from '../../actions'
import { DialogProps } from './DialogProps'

enum $ {
  container = 'confirmation-dialog',
  cancelButton = 'confirmation-dialog-cancel-button',
  okButton = 'confirmation-dialog-ok-button',
}

const ConfirmationDialog = ({
  open,
  data: { message, action, onCancel },
}: DialogProps<ConfirmationDialogData>) => {
  const dispatch = useDispatch()

  const dispatchAction = useCallback(() => {
    dispatch(action)
    dispatch(actions.closeDialog())
  }, [dispatch, action])

  const cancel = useCallback(() => {
    onCancel && dispatch(onCancel)
    dispatch(actions.closeDialog())
  }, [dispatch, onCancel])

  return (
    <Dialog open={open} className={$.container}>
      <DialogContent style={{ whiteSpace: 'pre-line' }}>
        {message}
      </DialogContent>
      <DialogActions>
        <Button onClick={cancel} id={$.cancelButton} color="primary">
          Cancel
        </Button>
        <Button onClick={dispatchAction} id={$.okButton} color="primary">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmationDialog

export { $ as confirmationDialog$ }
