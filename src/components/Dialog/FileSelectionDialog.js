import React from 'react'
import { connect } from 'react-redux'
import { Dialog, DialogContent } from '@material-ui/core'
import FileSelectionForm from '../FileSelectionForm'
import * as r from '../../redux'
import { getExtensions } from '../../utils/files'

const FileSelectionDialog = ({
  open,
  closeDialog,
  onSubmit,
  openFileFailure,
  message,
  file,
}) => (
  <Dialog open={open}>
    <DialogContent>
      <FileSelectionForm
        message={message}
        onSubmit={onSubmit}
        extensions={getExtensions(file)}
        cancel={openFileFailure}
      />
    </DialogContent>
  </Dialog>
)

const mapDispatchToProps = (dispatch, { file, closeDialog }) => ({
  closeDialog,
  onSubmit: path => {
    dispatch(r.locateFileSuccess(file, path))
    closeDialog()
  },
  openFileFailure: () => {
    dispatch(
      r.openFileFailure(file, null, 'File-locating action was canceled.')
    )
    closeDialog()
  },
})

export default connect(
  null,
  mapDispatchToProps
)(FileSelectionDialog)
