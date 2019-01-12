import React, { Component } from 'react'
import { connect } from 'react-redux'
import { TextField, Button } from '@material-ui/core'
import { Redirect } from 'react-router-dom'
import { remote, shell } from 'electron'
import * as r from '../redux'
// import * as css from './DefineSchemaForm.module.css'

const openInBrowser = e => {
  e.preventDefault()
  shell.openExternal(e.target.href)
}

class DefineSchemaForm extends Component {
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
      <section>
        <p>What kind of flashcards are you making?</p>
        <p>Define your flashcard fields below.</p>

        <p>
          <small>
            Experienced Anki users: it will probably make things easier if these
            fields match those of the note type you want to use.
          </small>
        </p>
        <form>
          <TextField
            value={locationText}
            onClick={onLocationTextFocus}
            onKeyPress={onLocationTextFocus}
            error={Boolean(errorText)}
            helperText={errorText}
          />

          <p>In case you want to reuse these fields later:</p>

          <TextField
            value={locationText}
            onClick={onLocationTextFocus}
            onKeyPress={onLocationTextFocus}
            error={Boolean(errorText)}
            helperText={errorText}
          />

          <p>
            <Button onClick={handleSubmit} fullWidth>
              Continue
            </Button>
          </p>
        </form>
      </section>
    )
  }
}

const mapStateToProps = state => ({})

const mapDispatchToProps = {}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DefineSchemaForm)
