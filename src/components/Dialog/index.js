import React from 'react'
import { connect } from 'react-redux'
import * as r from '../../redux'
import Confirmation from './Confirmation'

const DIALOGS = {
  Confirmation,
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
