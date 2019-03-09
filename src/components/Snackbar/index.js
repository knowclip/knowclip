import React from 'react'
import { connect } from 'react-redux'
import * as r from '../../redux'
import SimpleMessage from './SimpleMessage'

const SNACKBARS = {
  SimpleMessage,
}

const SnackbarView = ({ currentSnackbar, closeSnackbar }) => {
  if (!currentSnackbar) return null

  const CurrentSnackbarComponent = SNACKBARS[currentSnackbar.type]
  return (
    <CurrentSnackbarComponent
      key={Date.now().toString()}
      closeSnackbar={closeSnackbar}
      {...currentSnackbar.props}
    />
  )
}
const mapStateToProps = state => ({
  currentSnackbar: r.getCurrentSnackbar(state),
})

const mapDispatchToProps = {
  closeSnackbar: r.closeSnackbar,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SnackbarView)
