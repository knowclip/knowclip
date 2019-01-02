import React from 'react'
import { connect } from 'react-redux'
import { Dialog, DialogContent, DialogActions, Button } from '@material-ui/core'

const ConfirmationDialog = ({ open, closeDialog, message, dispatchAction }) => (
  <Dialog open={open}>
    <DialogContent>{message}</DialogContent>
    <DialogActions>
      <Button onClick={closeDialog}>Cancel</Button>
      <Button onClick={dispatchAction}>Ok</Button>
    </DialogActions>
  </Dialog>
)

const mapDispatchToProps = (dispatch, { action, closeDialog }) => ({
  dispatchAction: () => {
    dispatch(action)
    closeDialog()
  },
})

export default connect(
  null,
  mapDispatchToProps
)(ConfirmationDialog)
