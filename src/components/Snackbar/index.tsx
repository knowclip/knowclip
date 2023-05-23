import React from 'react'
import { useSelector } from 'react-redux'
import r from '../../redux'
import SimpleMessage from './SimpleMessage'
import Prompt from './Prompt'

import { snackbar$ as $ } from '../Snackbar.testLabels'

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
          closeButtonId={$.closeButton}
        />
      )

    case 'Prompt':
      return (
        <Prompt
          key={Date.now().toString()}
          {...currentSnackbar.props}
          closeButtonId={$.closeButton}
        />
      )
  }
}

export default SnackbarView
