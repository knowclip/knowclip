import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  TextField,
  Button,
  IconButton,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
} from '@material-ui/core'
import * as r from '../redux'
import uuid from 'uuid/v4'
import { Add as AddIcon, Delete as DeleteIcon } from '@material-ui/icons'

const newField = (name = '') => ({ id: uuid(), name })

const deleteKey = (obj, key) => {
  const clone = { ...obj }
  delete clone[key]
  return clone
}

class NoteTypeForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      noteType: props.noteType || {
        fields: [newField('Front'), newField('Back')],
        name: '',
        useTagsField: true,
        id: uuid(),
      },
      errors: {
        name: null,
        fields: {},
      },
    }

    this.validate = this.getValidator([])
  }

  noteTypeAlreadySaved() {
    return Boolean(this.props.id)
  }

  getValidator = noteTypeNames => state => {
    const errors = {}
    const { noteType } = state

    if (
      !this.noteTypeAlreadySaved() &&
      noteTypeNames.includes(noteType.name.trim())
    )
      errors.name =
        'You have already used this name for an existing note type. Please choose a unique name.'

    if (!noteType.name.trim())
      errors.name = 'Please enter a name for your note type.'

    const fieldsErrors = {}
    noteType.fields.forEach((field, i) => {
      const trimmedName = field.name.trim()
      if (!trimmedName) fieldsErrors[i] = 'Please enter a name for this field.'
      else if (
        noteType.fields.some((f, j) => i < j && f.name.trim() === trimmedName)
      )
        fieldsErrors[i] = 'Please use a unique name for this field.'
    })

    if (Object.keys(fieldsErrors).length) errors.fields = fieldsErrors

    return errors
  }

  handleSubmit = e => {
    const errors = this.validate(this.state)

    if (Object.keys(errors).length) return this.setState({ errors })
    const { noteType } = this.state

    if (this.noteTypeAlreadySaved()) {
      this.props.editNoteTypeRequest(noteType.id, noteType)
    } else {
      this.props.addNoteType(noteType)
      this.props.setDefaultNoteType(noteType.id)
    }
    this.props.onSubmit()
  }

  setNameText = text =>
    this.setState(state => ({
      noteType: { ...state.noteType, name: text },
      errors: deleteKey(state.errors, 'name'),
    }))
  setFieldText = (index, text) =>
    this.setState(state => ({
      noteType: {
        ...state.noteType,
        fields: state.noteType.fields.map((field, i) =>
          i === index ? { ...field, name: text } : field
        ),
      },
      errors: {
        ...state.errors,
        fields: deleteKey(state.errors.fields, index),
      },
    }))
  addField = () =>
    this.setState(state => ({
      noteType: {
        ...state.noteType,
        fields: [...state.noteType.fields, newField()],
      },
    }))
  deleteField = index =>
    this.state.noteType.fields.length === 1
      ? this.props.simpleMessageSnackbar(
          'You must have at least one field to make flashcards!'
        )
      : this.setState(state => ({
          noteType: {
            ...state.noteType,
            fields: state.noteType.fields.filter((f, i) => i !== index),
          },
        }))

  handleChangeNoteFieldText = i => e => this.setFieldText(i, e.target.value)
  handleChangeNoteNameText = e => this.setNameText(e.target.value)
  handleChangeCheckbox = e =>
    this.setState(state => ({
      noteType: {
        ...state.noteType,
        useTagsField: !state.noteType.useTagsField,
      },
    }))

  render() {
    const { noteType, errors } = this.state
    const { handleSubmit } = this
    const { cancel, id } = this.props
    return (
      <>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <h3>Flashcard template</h3>
            <TextField
              label="Template name"
              value={noteType.name}
              error={Boolean(errors.name)}
              helperText={errors.name}
              onChange={this.handleChangeNoteNameText}
            />
            <h4>Fields</h4>

            <p>
              <small>
                If you already have an Anki note type in mind, it will probably
                make things easier if these fields match those of your note
                type.
              </small>
            </p>

            <ul>
              {noteType.fields.map((field, i) => {
                const error = errors.fields ? errors.fields[i] : null
                return (
                  <li>
                    <TextField
                      value={field.name}
                      error={Boolean(error)}
                      helperText={error}
                      onChange={this.handleChangeNoteFieldText(i)}
                    />
                    <IconButton onClick={() => this.deleteField(i)}>
                      <DeleteIcon />
                    </IconButton>
                  </li>
                )
              })}
            </ul>
            <Button onClick={this.addField}>
              Add field <AddIcon />
            </Button>

            <p>
              <FormControlLabel
                label="Include tags field"
                control={
                  <Checkbox
                    checked={noteType.useTagsField}
                    onChange={this.handleChangeCheckbox}
                  />
                }
              />
            </p>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancel}>Exit</Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogActions>
      </>
    )
  }
}

const mapStateToProps = (state, { id }) => ({
  noteType: r.getNoteType(state, id),
})

const mapDispatchToProps = {
  addNoteType: r.addNoteType,
  simpleMessageSnackbar: r.simpleMessageSnackbar,
  editNoteTypeRequest: r.editNoteTypeRequest,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(NoteTypeForm)
