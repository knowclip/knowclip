import React, { Component } from 'react'
import { connect } from 'react-redux'
import { TextField, Button } from '@material-ui/core'
import { shell } from 'electron'
import * as r from '../redux'
import * as css from './MediaFolderLocationForm.module.css'
import { showOpenDialog } from '../utils/electron'

const openInBrowser = e => {
  e.preventDefault()
  shell.openExternal(e.target.href)
}

export default class FileSelectionForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      locationText: '',
      errorText: '',
    }
  }

  onLocationTextFocus = async e => {
    const filePaths = await showOpenDialog(
      this.props.extensions.map(ext => ({ name: 'File', extensions: ext }))
    )

    if (!filePaths) return

    const [directory] = filePaths
    this.setLocationText(directory)
  }

  handleSubmit = e => {
    if (this.state.locationText) {
      this.props.onSubmit(this.state.locationText)
    } else {
      this.showSubmitError()
    }
  }

  setLocationText = text => this.setState({ locationText: text, errorText: '' })

  showSubmitError = () =>
    this.setState({ errorText: 'Please choose a location to continue.' })

  render() {
    const { message, cancel } = this.props
    const { locationText, errorText } = this.state
    const { onLocationTextFocus, handleSubmit } = this
    return (
      <section className={css.container}>
        <p className={css.prompt}>{message}</p>
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
            <Button onClick={cancel}>Cancel</Button>
          </p>
        </form>
      </section>
    )
  }
}
