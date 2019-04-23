import React from 'react'
import { connect } from 'react-redux'
import * as r from '../../redux'
import Confirmation from './Confirmation'
import MediaFolderLocationForm from './MediaFolderLocationFormDialog'
import ReviewAndExport from '../ReviewAndExport'
import NewProjectForm from './NewProjectFormDialog'
import OpenMediaFileFailure from './OpenMediaFileFailureDialog'

const DIALOGS = {
  Confirmation,
  MediaFolderLocationForm,
  ReviewAndExport,
  NewProjectForm,
  OpenMediaFileFailure,
}

const DialogView = ({ currentDialog, closeDialog }) => {
  if (!currentDialog) return null

  const CurrentDialogComponent = DIALOGS[currentDialog.type]
  return (
    <CurrentDialogComponent
      open={true}
      closeDialog={closeDialog}
      {...currentDialog.props}
    />
  )
}
const mapStateToProps = state => ({
  currentDialog: r.getCurrentDialog(state),
})

const mapDispatchToProps = {
  closeDialog: r.closeDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DialogView)
