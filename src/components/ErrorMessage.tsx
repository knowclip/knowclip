import React from 'react'
import {
  MuiThemeProvider,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Dialog,
} from '@material-ui/core'
import { theme } from './App'

const ErrorMessage = (error: any) => {
  return (
    <MuiThemeProvider theme={theme}>
      <Dialog open={true}>
        <DialogContent>
          <DialogContentText>
            An error has occurred. Please restart the app to continue.
            <details>
              <summary>Details</summary>
              <pre>
                {String(error) === '[object Object]'
                  ? JSON.stringify(
                      {
                        message: error.message,
                      },
                      null,
                      2
                    )
                  : String(error)}
              </pre>
            </details>
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
