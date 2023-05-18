import React, { Component } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Routes, Route } from 'react-router'
import Snackbar from './Snackbar'
import Main from './Main'
import Dialog from './Dialog'
import ProjectsMenu from './ProjectsMenu'
import { ThemeProvider } from '@mui/material/styles'
import ErrorMessage from './ErrorMessage'
import { theme } from './theme'
import { CssBaseline } from '@mui/material'

class App extends Component<
  { sentryDsn: string },
  { hasError: boolean; error: any }
> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError)
      return <ErrorMessage reactError={this.state.error} />
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProjectsMenu />} />
            <Route path="/project/:projectId" element={<Main />} />
          </Routes>
        </BrowserRouter>
        <Snackbar />
        <Dialog />
      </ThemeProvider>
    )
  }
}

export default App
