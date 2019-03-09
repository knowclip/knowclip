import React from 'react'
import { connect } from 'react-redux'
import { Dialog, DialogContent } from '@material-ui/core'
import MediaFolderLocationForm from '../MediaFolderLocationForm'

const MediaFolderLocationFormDialog = ({
  open,
  closeDialog,
  dispatchAction,
  noteTypeId,
}) => (
  <Dialog open={open}>
    <DialogContent>
      <MediaFolderLocationForm id={noteTypeId} onSubmit={dispatchAction} />
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
)(MediaFolderLocationFormDialog)
