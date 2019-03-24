import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Dialog,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from '@material-ui/core'
import uuid from 'uuid/v4'
import { showSaveDialog } from '../../utils/electron'
import * as r from '../../redux'

const deleteKey = (obj, key) => {
  const clone = { ...obj }
  delete clone[key]
  return clone
}

class NewProjectFormDialog extends Component {
  state = {
    fieldValues: {
      name: '',
      filePath: '',
    },
    errors: {
      name: null,
      filePath: null,
    },
  }

  validate = () => {
    const errors = {}
    const { fieldValues } = this.state

    if (!fieldValues.name.trim())
      errors.name = 'Please enter a name for your project.'

    if (!fieldValues.filePath.trim())
      errors.filePath = 'Please specify where you want to save your project.'

    return errors
  }

  handleSubmit = e => {
    const errors = this.validate(this.state)
    if (Object.keys(errors).length) return this.setState({ errors })

    const { filePath, name } = this.state.fieldValues
    this.props.createProject(
      {
        id: uuid(),
        filePath,
        name,
        mediaFilePaths: [],
        error: null,
      },
      {
        id: uuid(),
        name: 'default',
        fields: [{ id: 'front', name: 'Front' }, { id: 'back', name: 'Back' }],
        useTagsField: true,
      }
    )
    this.props.closeDialog()
  }

  setNameText = text =>
    this.setState(state => ({
      // ...state,
      fieldValues: { ...state.fieldValues, name: text },
      errors: deleteKey(state.errors, 'name'),
    }))

  setFilePathText = text => {
    console.log('boop!', text)
    this.setState(state => ({
      // ...state,
      fieldValues: { ...state.fieldValues, filePath: text },
      errors: deleteKey(state.errors, 'filePath'),
    }))
  }

  handleChangeNameText = e => this.setNameText(e.target.value)
  handleChangeFilePathNameText = e => this.setFilePathText(e.target.value)

  showSaveDialog = async () => {
    const filePath = await showSaveDialog('AFCA Project File', ['afca'])
    console.log('filePath', filePath)
    return filePath ? this.setFilePathText(filePath) : null
  }

  render() {
    const { open, closeDialog } = this.props
    const { fieldValues, errors } = this.state
    const { handleSubmit } = this

    return (
      <Dialog open={open}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <h3>New project</h3>
            <TextField
              label="Project name"
              value={fieldValues.name}
              error={Boolean(errors.name)}
              helperText={errors.name}
              onChange={this.handleChangeNameText}
            />

            <br />

            <TextField
              label="Project file location"
              value={fieldValues.filePath}
              error={Boolean(errors.filePath)}
              helperText={errors.filePath}
              onClick={this.showSaveDialog}
              onKeyPress={this.showSaveDialog}
              // onChange={this.handleChangeFilePathTextasdfadsf}
            />
          </form>
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
