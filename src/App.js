import React, { Component } from 'react'
import { HashRouter } from 'react-router-dom'
import { Switch, Route } from 'react-router'
import { connect } from 'react-redux'
// import * as r from './redux'
import './App.css'
import Snackbar from './components/Snackbar'
import Dialog from './components/Dialog'
import Main from './components/Main'

class App extends Component {
  render() {
    return (
      <>
        <HashRouter>
          <Switch>
            <Route exact path="/" component={Main} />
          </Switch>
        </HashRouter>
        <Snackbar />
        <Dialog />
      </>
    )
  }
}

const mapStateToProps = state => ({})

export default connect(
  mapStateToProps,
  {}
)(App)
