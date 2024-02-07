import React, { Component } from 'react'
import { HashRouter } from 'react-router-dom'
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
  { hasError: boolean; error: unknown }
> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError)
      return <ErrorMessage reactError={this.state.error} />
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HashRouter>
          <Routes>
            <Route path="/" element={<ProjectsMenu />} />
            <Route path="/project/:projectId" element={<Main />} />
          </Routes>
        </HashRouter>
        <Snackbar />
        <Dialog />
      </ThemeProvider>
    )
  }
}

export default App
