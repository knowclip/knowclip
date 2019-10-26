import React from 'react'
import { connect } from 'react-redux'
import { Dialog, DialogContent } from '@material-ui/core'
import FileSelectionForm from '../FileSelectionForm'

const FileSelectionDialog = ({
  open,
  closeDialog,
  dispatchAction,
  message,
}) => (
  <Dialog open={open}>
    <DialogContent>
      <FileSelectionForm message={message} onSubmit={dispatchAction} />
    </DialogContent>
  </Dialog>
)

const mapDispatchToProps = (dispatch, { action, closeDialog }) => ({
  dispatchAction: () => {
    action && dispatch(action)
    closeDialog()
  },
})

export default connect(
  null,
  mapDispatchToProps
)(FileSelectionDialog)
