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

const ErrorMessage = ({ reactError }: { reactError: any }) => {
  console.log('crash:', { reactError })
  console.error(reactError)
  return (
    <MuiThemeProvider theme={theme}>
      <Dialog open={true}>
        <DialogContent>
          <DialogContentText>
            An error has occurred. Please restart the app to continue.
              <h3>Details</h3>
              <pre>
                {reactError?.message
                  ? JSON.stringify(
                      {
                        message: reactError.message,
                      },
                      null,
                      2
                    )
                  : String(reactError)}
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
    </MuiThemeProvider>
  )
}

export default ErrorMessage
