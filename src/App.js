import React, { Component } from 'react'
import { HashRouter } from 'react-router-dom'
import { Switch, Route } from 'react-router'
import { connect } from 'react-redux'
import * as r from './redux'
import './App.css'
import Main from './components/Main'
import MediaFolderLocationForm from './components/MediaFolderLocationForm'

class App extends Component {
  render() {
    const { mediaFolderLocation } = this.props
    return (
      <HashRouter>
        <Switch>
          <Route
            exact
            path="/"
            render={() =>
              mediaFolderLocation ? <Main /> : <MediaFolderLocationForm />
            }
          />
          <Route
            exact
            path="/media-folder-location"
            component={MediaFolderLocationForm}
          />
        </Switch>
      </HashRouter>
    )
  }
}

const mapStateToProps = state => ({
  mediaFolderLocation: r.getMediaFolderLocation(state),
})

export default connect(
  mapStateToProps,
  {}
)(App)
