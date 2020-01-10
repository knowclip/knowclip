import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Dialog,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  FormHelperText,
} from '@material-ui/core'
import uuid from 'uuid/v4'
import { showSaveDialog } from '../../utils/electron'
import * as r from '../../redux'
import deleteKey from '../../utils/deleteKey'
import css from './NewProjectFormDialog.module.css'
import cn from 'classnames'

const CardPreview = ({ noteType }) => {
  switch (noteType) {
    case 'Simple':
      return (
        <section className={css.cardsPreview}>
          <h3 className={css.cardPreviewHeading}>Preview</h3>
          <p className={css.cardPreviewSummary}>
            Includes fields for transcription, meaning, and notes.
          </p>
          <Paper className={cn(css.cardPreview, 'card')}>
            ♫
            <hr />
            <p className="transcription">¿Cuál es tu nombre?</p>
            <p className="meaning">What's your name?</p>
            <p className="notes">
              The "tu" makes it informal. In a formal setting, or when speaking
              to someone older, you would say "su" instead.
            </p>
          </Paper>
        </section>
      )
    case 'Transliteration':
      return (
        <section className={css.cardsPreview}>
          <h3 className={css.cardPreviewHeading}>Preview</h3>
          <p className={css.cardPreviewSummary}>
            Includes fields for transcription, pronunciation, meaning, and
            notes. Especially useful when learning a language with a different
            writing system.
          </p>
          <Paper className={cn(css.cardPreview, 'card')}>
            ♫
            <hr />
            <p className="transcription">你叫什麼名字?</p>
            <p className="pronunciation">Nǐ jiào shénme míngzi?</p>
            <p className="meaning">What's your name?</p>
            <p className="notes">This is less formal than "您貴姓?"</p>
          </Paper>
        </section>
      )
    default:
      return null
  }
}

class NewProjectFormDialog extends Component {
  state = {
    fieldValues: {
      name: '',
      filePath: '',
      noteType: '',
    },
    errors: {
      name: null,
      filePath: null,
      noteType: null,
    },
  }

  validate = () => {
    const errors = {}
    const { fieldValues } = this.state

    if (!fieldValues.name.trim())
      errors.name = 'Please enter a name for your project.'

    if (!fieldValues.filePath.trim())
      errors.filePath = 'Please specify where you want to save your project.'

    if (!fieldValues.noteType.trim())
      errors.noteType = 'Please choose a note type.'

    return errors
  }

  handleSubmit = e => {
    const errors = this.validate(this.state)
    if (Object.keys(errors).length) return this.setState({ errors })

    const { filePath, name } = this.state.fieldValues
    this.props.createProject(
      uuid(),
      name,
      this.state.fieldValues.noteType,
      filePath
    )
    this.props.closeDialog()
  }

  setNameText = text =>
    this.setState(state => ({
      fieldValues: { ...state.fieldValues, name: text },
      errors: deleteKey(state.errors, 'name'),
    }))

  setFilePathText = text => {
    this.setState(state => ({
      fieldValues: { ...state.fieldValues, filePath: text },
      errors: deleteKey(state.errors, 'filePath'),
    }))
  }

  handleChangeNameText = e => this.setNameText(e.target.value)
  handleChangeFilePathNameText = e => this.setFilePathText(e.target.value)
  handleChangeNoteType = e =>
    this.setState(state => ({
      fieldValues: { ...state.fieldValues, noteType: e.target.value },
      errors: deleteKey(state.errors, 'noteType'),
    }))

  showSaveDialog = async () => {
    const filePath = await showSaveDialog('AFCA Project File', ['afca'])
    return filePath ? this.setFilePathText(filePath) : null
  }

  render() {
    const { open, closeDialog } = this.props
    const { fieldValues, errors } = this.state
    const { handleSubmit } = this

    return (
      <Dialog open={open}>
        <DialogContent>
          <form className={css.form} onSubmit={handleSubmit}>
            <h3>New project</h3>
            <TextField
              fullWidth
              label="Project name"
              value={fieldValues.name}
              error={Boolean(errors.name)}
              helperText={errors.name}
              onChange={this.handleChangeNameText}
            />

            <br />
            <br />

            <TextField
              fullWidth
              label="Project file location"
              value={fieldValues.filePath}
              error={Boolean(errors.filePath)}
              helperText={errors.filePath}
              onClick={this.showSaveDialog}
              onKeyPress={this.showSaveDialog}
            />

            <br />
            <br />

            <FormControl fullWidth error={Boolean(errors.noteType)}>
              <InputLabel htmlFor="note-type">Note type</InputLabel>
              <Select
                value={this.state.fieldValues.noteType}
                onChange={this.handleChangeNoteType}
                inputProps={{
                  name: 'note-type',
                  id: 'note-type',
                }}
              >
                <MenuItem value="" />
                <MenuItem value="Simple">Simple</MenuItem>
                <MenuItem value="Transliteration">
                  Including pronunciation field
                </MenuItem>
              </Select>
              <FormHelperText>{errors.noteType}</FormHelperText>
            </FormControl>
          </form>

          <CardPreview noteType={this.state.fieldValues.noteType} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Exit</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogActions>
      </Dialog>
    )
  }
}

const mapDispatchToProps = {
  createProject: r.createProject,
}

export default connect(
  null,
  mapDispatchToProps
)(NewProjectFormDialog)
