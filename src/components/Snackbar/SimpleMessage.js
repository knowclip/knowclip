import React, { Component } from 'react'
import { Snackbar, IconButton } from '@material-ui/core'
import { Close } from '@material-ui/icons'
import DarkTheme from '../DarkTheme'

class SimpleMessageSnackbar extends Component {
  state = { open: true }

  handleClose = (e, reason) =>
    reason === 'clickaway' ? null : this.setState({ open: false })

  handleExited = () => this.props.closeSnackbar()

  render() {
    const { message } = this.props
    return (
      <Snackbar
        open={this.state.open}
        message={message}
        autoHideDuration={15000}
        onClose={this.handleClose}
        onExited={this.handleExited}
        action={
          <DarkTheme>
            <IconButton onClick={this.handleClose}>
              <Close />
            </IconButton>
          </DarkTheme>
        }
      />
    )
  }
}

export default SimpleMessageSnackbar
