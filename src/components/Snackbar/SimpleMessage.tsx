import React, { useState, useCallback } from 'react'
import { Snackbar, IconButton } from '@material-ui/core'
import { Close } from '@material-ui/icons'
import DarkTheme from '../DarkTheme'
import { useDispatch } from 'react-redux'
import { closeSnackbar } from '../../actions'

const SimpleMessageSnackbar = ({ message }: { message: string }) => {
  const [open, setOpen] = useState(true)

  const handleClose = useCallback(e => setOpen(false), [setOpen])

  const dispatch = useDispatch()
  const handleExited = useCallback(e => dispatch(closeSnackbar()), [dispatch])

  return (
    <Snackbar
      open={open}
      message={message}
      autoHideDuration={15000}
      onClose={handleClose}
      onExited={handleExited}
      action={
        <DarkTheme>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </DarkTheme>
      }
    />
  )
}

export default SimpleMessageSnackbar
