import React, { Component } from 'react'
import { connect } from 'react-redux'
import { TextField, Button, IconButton } from '@material-ui/core'
import { Redirect } from 'react-router-dom'
import { remote, shell } from 'electron'
import * as r from '../redux'
import uuid from 'uuid/v4'
import { Add as AddIcon, Delete as DeleteIcon } from '@material-ui/icons'

// import * as css from './DefineSchemaForm.module.css'

const newField = (name = '') => ({ name })

const getValidator = noteTypeNames => state => {
  const errors = {}
  const { noteType } = state

  if (noteTypeNames.includes(noteType.name.trim()))
    errors.name =
      'You have already used this name for an existing note type. Please choose a unique name.'

  if (!noteType.name.trim())
    errors.name = 'Please enter a name for your note type.'

  const fieldsErrors = {}
  noteType.fields.forEach((field, i) => {
    if (!field.name.trim())
      fieldsErrors[i] = 'Please enter a name for this field.'
  })

  if (Object.keys(fieldsErrors).length) errors.fields = fieldsErrors

  return errors
}

const deleteKey = (obj, key) => {
  const clone = { ...obj }
  delete clone[key]
  return clone
}

class DefineSchemaForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      noteType: {
        fields: [newField('Front'), newField('Back')],
        name: '',
        id: uuid(),
      },
      errors: {
        name: null,
        fields: {},
      },
      submitted: false,
    }

    this.validate = getValidator(props.noteTypeNames)
  }

  handleSubmit = e => {
    const errors = this.validate(this.state)

    if (Object.keys(errors).length) return this.setState({ errors })
    const { noteType } = this.state
    this.setState({ submitted: true }, () => {
      this.props.addNoteType(noteType)
      this.props.setDefaultNoteType(noteType.id)
    })
  }

  setNameText = text =>
    this.setState(state => ({
      // ...state,
      noteType: { ...state.noteType, name: text },
      errors: deleteKey(state.errors, 'name'),
    }))
  setFieldText = (index, text) =>
    this.setState(state => ({
      // ...state,
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

  render() {
    if (this.state.submitted) return <Redirect to="/" />

    const { noteType, errors } = this.state
    const { handleSubmit } = this
    return (
      <section>
        <p>What kind of flashcards are you making?</p>
        <p>Define your flashcard fields below.</p>

        <p>
          <small>
            If you already have an Anki note type in mind, it will probably make
            things easier if these fields match those of your note type.
          </small>
        </p>
        <form>
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

          <p>In case you want to reuse these fields later:</p>

          <TextField
            value={noteType.name}
            error={Boolean(errors.name)}
            helperText={errors.name}
            onChange={this.handleChangeNoteNameText}
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

const mapStateToProps = state => ({
  // noteTypeFields: r.getNoteTypeFields(state),
  // noteTypeName: r.getNoteTypeId(state),
  noteTypeNames: r.getNoteTypeNames(state),
})

const mapDispatchToProps = {
  addNoteType: r.addNoteType,
  setDefaultNoteType: r.setDefaultNoteType,
  simpleMessageSnackbar: r.simpleMessageSnackbar,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DefineSchemaForm)
