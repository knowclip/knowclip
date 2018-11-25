import React from 'react'
import { Snackbar, IconButton } from '@material-ui/core'
import { Close } from '@material-ui/icons'

const SimpleMessageSnackbar = ({ open, closeSnackbar, message }) => (
  <Snackbar
    open={open}
    message={message}
    action={
      <IconButton onClick={closeSnackbar}>
        <Close />
      </IconButton>
    }
  />
)

export default SimpleMessageSnackbar
