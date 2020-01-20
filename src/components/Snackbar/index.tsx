import React from 'react'
import { useSelector } from 'react-redux'
import * as r from '../../redux'
import SimpleMessage from './SimpleMessage'

export const testLabels = { closeButton: 'close-snackbar-button' } as const

const SnackbarView = () => {
  const currentSnackbar = useSelector((state: AppState) =>
    r.getCurrentSnackbar(state)
  )

  if (!currentSnackbar) return null

  switch (currentSnackbar.type) {
    case 'SimpleMessage':
      return (
        <SimpleMessage
          key={Date.now().toString()}
          {...currentSnackbar.props}
          closeButtonId={testLabels.closeButton}
        />
      )
  }
}

export default SnackbarView
