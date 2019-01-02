import React, { Component } from 'react'
import { connect } from 'react-redux'
import { TextField, Button } from '@material-ui/core'
import { Redirect } from 'react-router-dom'
import { remote, shell } from 'electron'
import * as r from '../redux'
import * as css from './MediaFolderLocationForm.module.css'

const openInBrowser = e => {
  e.preventDefault()
  shell.openExternal(e.target.href)
}

class MediaFolderLocationForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      locationText: props.mediaFolderLocation || '',
      errorText: '',
      submitted: false,
    }
  }

  onLocationTextFocus = e => {
    remote.dialog.showOpenDialog(
      { properties: ['openDirectory'] },
      filePaths => {
        if (!filePaths) return

        const [directory] = filePaths
        this.setLocationText(directory)
      }
    )
  }

  handleSubmit = e => {
    if (this.state.locationText) {
      this.props.setMediaFolderLocation(this.state.locationText)
      this.setState({ submitted: true })
    } else {
      this.showSubmitError()
    }
  }

  setLocationText = text => this.setState({ locationText: text, errorText: '' })

  showSubmitError = () =>
    this.setState({ errorText: 'Please choose a location to continue.' })

  render() {
    if (this.state.submitted) return <Redirect to="/" />

    const { locationText, errorText } = this.state
    const { onLocationTextFocus, handleSubmit } = this
    return (
      <section className={css.container}>
        <p className={css.prompt}>
          Enter the location of your{' '}
          <a
            href="https://apps.ankiweb.net/docs/manual.html#files"
            onClick={openInBrowser}
          >
            Anki collection.media folder,
          </a>{' '}
          or wherever you'd like your audio files to be saved.
        </p>
        <form className={css.form}>
          <TextField
            className={css.textField}
            value={locationText}
            onClick={onLocationTextFocus}
            onKeyPress={onLocationTextFocus}
            error={Boolean(errorText)}
            helperText={errorText}
          />
          <p className={css.submitButton}>
            <Button onClick={handleSubmit} fullWidth>
              Continue
            </Button>
          </p>
        </form>
      </section>
    )
  }
}

const mapStateToProps = state => ({
  mediaFolderLocation: r.getMediaFolderLocation(state),
})

const mapDispatchToProps = {
  setMediaFolderLocation: r.setMediaFolderLocation,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MediaFolderLocationForm)
