import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Dialog, DialogContent, DialogActions, Button } from '@mui/material'
import { actions } from '../../actions'
import { DialogProps } from './DialogProps'

import { confirmationDialog$ as $ } from './Confirmation.testLabels'

const ConfirmationDialog = ({
  open,
  data: { message, action, onCancel },
}: DialogProps<ConfirmationDialogData>) => {
  const dispatch = useDispatch()

  const dispatchAction = useCallback(() => {
    dispatch(actions.closeDialog())
    dispatch(action)
  }, [dispatch, action])

  const cancel = useCallback(() => {
    dispatch(actions.closeDialog())
    onCancel && dispatch(onCancel)
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
