import React, { useState, useCallback } from 'react'
import { Snackbar, IconButton, SnackbarProps } from '@mui/material'
import { Close } from '@mui/icons-material'
import DarkTheme from '../DarkTheme'
import { useDispatch } from 'react-redux'
import cn from 'clsx'
import r from '../../redux'
import { snackbar$ } from '../Snackbar.testLabels'

const SimpleMessageSnackbar = ({
  message,
  closeButtonId,
  autoHideDuration = 15000,
}: {
  message: string
  closeButtonId: string
  autoHideDuration?: number | null
}) => {
  const [open, setOpen] = useState(true)

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [setOpen])
  const closeExceptOnClickaway: NonNullable<SnackbarProps['onClose']> =
    useCallback(
      (e, reason) => {
        if (reason !== 'clickaway') handleClose()
      },
      [handleClose]
    )

  const dispatch = useDispatch()
  const handleExited = useCallback(
    () => dispatch(r.closeSnackbar()),
    [dispatch]
  )

  return (
    // TODO: distinguish error and success messages
    <Snackbar
      className={cn(snackbar$.container)}
      open={open}
      message={message}
      autoHideDuration={autoHideDuration}
      onClose={closeExceptOnClickaway}
      TransitionProps={{
        onExited: handleExited,
      }}
      action={
        <DarkTheme>
          <IconButton onClick={handleClose} id={closeButtonId}>
            <Close />
          </IconButton>
        </DarkTheme>
      }
    />
  )
}

export default SimpleMessageSnackbar
