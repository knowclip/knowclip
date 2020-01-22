import React from 'react'
import { HashRouter } from 'react-router-dom'
import { Switch, Route } from 'react-router'
import Snackbar from './Snackbar'
import Dialog from './Dialog'
import Main from './Main'
import ProjectsMenu from './ProjectsMenu'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import themeSpecs from '../themeSpecs'
import { CssBaseline } from '@material-ui/core'

const theme = createMuiTheme(themeSpecs)

const App = () => (
  <MuiThemeProvider theme={theme}>
    <CssBaseline />
    <HashRouter>
      <Switch>
        <Route exact path="/" component={Main} />
        <Route exact path="/projects" component={ProjectsMenu} />
      </Switch>
    </HashRouter>
    <Snackbar />
    <Dialog />
  </MuiThemeProvider>
)

export default App
