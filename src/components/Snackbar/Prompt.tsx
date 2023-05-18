import React, { useState, useCallback, Fragment } from 'react'
import { Snackbar, IconButton, Button } from '@mui/material'
import { Close } from '@mui/icons-material'
import DarkTheme from '../DarkTheme'
import { useDispatch } from 'react-redux'
import cn from 'classnames'
import { snackbar$ } from '.'
import r from '../../redux'

const PromptSnackbar = ({
  message,
  actions,
  closeButtonId: _closeButtonId,
  autoHideDuration = 15000,
}: {
  message: string
  actions: [string, Action][]
  closeButtonId: string
  autoHideDuration?: number | null
}) => {
  const [open, setOpen] = useState(true)

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [setOpen])
  const closeExceptOnClickaway = useCallback(
    (e, reason) => {
      if (reason !== 'clickaway') handleClose()
    },
    [handleClose]
  )
  const dispatch = useDispatch()
  const dispatchAction = useCallback(
    (action) => {
      dispatch(action)
      setOpen(false)
    },
    [dispatch]
  )

  const handleExited = useCallback(
    (_e) => dispatch(r.closeSnackbar()),
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
          <Fragment>
            {actions.map(([label, action]) => (
              <Button key={label} onClick={() => dispatchAction(action)}>
                {label}
              </Button>
            ))}
            {!actions.some(([, action]) => action.type === 'closeSnackbar') && (
              <IconButton onClick={handleClose}>
                <Close />
              </IconButton>
            )}
          </Fragment>
        </DarkTheme>
      }
    />
  )
}

export default PromptSnackbar
