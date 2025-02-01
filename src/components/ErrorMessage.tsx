import React from 'react'
import {
  ThemeProvider,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Dialog,
} from '@mui/material'
import { theme } from './theme'

import { errorMessage$ as $ } from './ErrorMessage.testLabels'

const ErrorMessage = ({ reactError }: { reactError: any }) => {
  console.log('crash:', { reactError })
  console.error(reactError)

  return (
    <ThemeProvider theme={theme}>
      <Dialog open={true} className={$.container}>
        <DialogContent>
          <DialogContentText>
            An error has occurred. Please restart the app to continue.
            <h3>Details</h3>
            <pre style={{ whiteSpace: 'pre-line', fontSize: '0.6em' }}>
              {displayError(reactError)}
            </pre>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            color="primary"
            onClick={() => {
              window.location.reload()
            }}
          >
            Restart app
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  )
}

export default ErrorMessage

function displayError(error: any) {
  if (error instanceof Error || error?.message)
    return [
      'error: ' + (error.name || ''),
      error.message,
      error.stack || '',
    ].join('\n')

  const stringified = JSON.stringify(error, null, 2)
  if (stringified === '{}') {
    return [String(error), error?.constructor?.name].join(' - ')
  }

  return stringified
}
