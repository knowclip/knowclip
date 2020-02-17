import React, { useEffect } from 'react'
import { HashRouter } from 'react-router-dom'
import { Switch, Route } from 'react-router'
import Snackbar from './Snackbar'
import Dialog from './Dialog'
import Main from './Main'
import ProjectsMenu from './ProjectsMenu'
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles'
import themeSpecs from '../themeSpecs'
import { CssBaseline } from '@material-ui/core'
import { TEMPLATE_CSS } from '../utils/prepareExport'

const theme = createMuiTheme(themeSpecs)

const App = () => {
  useEffect(() => {
    const css = document.createElement('style')
    css.innerHTML = TEMPLATE_CSS
    document.head.appendChild(css)
  }, [])
  return (
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
}
export default App
