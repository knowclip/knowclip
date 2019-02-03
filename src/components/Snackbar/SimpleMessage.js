import React from 'react'
import { Snackbar, IconButton } from '@material-ui/core'
import { Close } from '@material-ui/icons'
import DarkTheme from '../DarkTheme'

const SimpleMessageSnackbar = ({ open, closeSnackbar, message }) => (
  <Snackbar
    open={open}
    message={message}
    action={
      <DarkTheme>
        <IconButton onClick={closeSnackbar}>
          <Close />
        </IconButton>
      </DarkTheme>
    }
  />
)

export default SimpleMessageSnackbar
