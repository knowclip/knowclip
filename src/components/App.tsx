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
import { ErrorBoundary } from '@sentry/react'

function App({ sentryDsn: _ }: { sentryDsn: string }) {
  return (
    <ErrorBoundary
      fallback={({ error }) => <ErrorMessage reactError={error} />}
    >
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
    </ErrorBoundary>
  )
}

export default App
