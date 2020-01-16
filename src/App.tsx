import React from 'react'
import { HashRouter } from 'react-router-dom'
import { Switch, Route } from 'react-router'
import './App.css'
import Snackbar from './components/Snackbar'
import Dialog from './components/Dialog'
import Main from './components/Main'
import ProjectsMenu from './components/ProjectsMenu'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import themeSpecs from './themeSpecs'

const theme = createMuiTheme(themeSpecs)

const App = () => (
  <MuiThemeProvider theme={theme}>
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
