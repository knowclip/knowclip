import React from 'react'
import {
  MuiThemeProvider,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Dialog,
} from '@material-ui/core'
import { theme } from './theme'

enum $ {
  container = 'error-message',
}
export { $ as errorMessage$ }

const ErrorMessage = ({ reactError }: { reactError: any }) => {
  console.log('crash:', { reactError })
  console.error(reactError)

  return (
    <MuiThemeProvider theme={theme}>
      <Dialog open={true} className={$.container}>
        <DialogContent>
          <DialogContentText>
            An error has occurred. Please restart the app to continue.
            <h3>Details</h3>
            <pre>{displayError(reactError)}</pre>
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
    </MuiThemeProvider>
  )
}

export default ErrorMessage

function displayError(error: any) {
  if (error instanceof Error || error?.message)
    return ['error: ' + error.name, error.message, error.stack].join('\n')

  const stringified = JSON.stringify(error, null, 2)
  if (stringified === '{}') {
    return [String(error), error?.constructor?.name].join(' - ')
  }

  return stringified
}
