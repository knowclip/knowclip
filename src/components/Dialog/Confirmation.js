import React from 'react'
import { connect } from 'react-redux'
import { Dialog, DialogContent, DialogActions, Button } from '@material-ui/core'

const ConfirmationDialog = ({ open, cancel, message, dispatchAction }) => (
  <Dialog open={open}>
    <DialogContent>{message}</DialogContent>
    <DialogActions>
      <Button onClick={cancel}>Cancel</Button>
      <Button onClick={dispatchAction}>Ok</Button>
    </DialogActions>
  </Dialog>
)

const mapDispatchToProps = (dispatch, { action, closeDialog, onCancel }) => ({
  dispatchAction: () => {
    dispatch(action)
    closeDialog()
  },
  cancel: () => {
    onCancel && dispatch(onCancel)
    dispatch(closeDialog())
  },
})

export default connect(
  null,
  mapDispatchToProps
)(ConfirmationDialog)
