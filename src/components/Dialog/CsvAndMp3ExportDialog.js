import React, { useState } from 'react'
import { connect } from 'react-redux'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@material-ui/core'
import * as r from '../../redux'
import { showOpenDirectoryDialog, showSaveDialog } from '../../utils/electron'
import { shell } from 'electron'

const openInBrowser = e => {
  e.preventDefault()
  shell.openExternal(e.target.href)
}

const CsvAndMp3ExportDialog = ({
  open,
  closeDialog,
  currentMediaFolderLocation,
  exportCsv,
  clipIds,
}) => {
  const [fields, setFields] = useState({
    mediaFolderLocation: currentMediaFolderLocation || '',
    csvFilePath: '',
  })
  const [errors, setErrors] = useState({})

  const onSubmit = () => {
    const { csvFilePath, mediaFolderLocation } = fields
    if (csvFilePath && mediaFolderLocation) {
      closeDialog()
      return exportCsv(clipIds, csvFilePath, mediaFolderLocation)
    }
    const errors = {}
    if (!csvFilePath)
      errors.csvFilePath =
        'Please choose a location to save your flashcards file.'
    if (!mediaFolderLocation)
      errors.mediaFolderLocation =
        'Please choose a location to save your audio clips.'
    setErrors(errors)
  }
  const setField = (key, value) => {
    setErrors(errors => ({ ...errors, [key]: null }))
    setFields(fields => ({
      ...fields,
      [key]: value,
    }))
  }

  const onFocusMediaFolderLocation = async e => {
    const directoryPath = await showOpenDirectoryDialog()
    if (directoryPath) setField('mediaFolderLocation', directoryPath)
  }

  const onFocusCsvFilePath = async e => {
    const filePath = await showSaveDialog('Comma-separated values', ['csv'])
    if (filePath) setField('csvFilePath', filePath)
  }

  return (
    <Dialog open={open}>
      <DialogContent>
        <form
          onSubmit={e => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <TextField
            fullWidth
            label={'CSV file location'}
            value={fields.csvFilePath}
            onChange={e => setField('csvFilePath', e.target.value)}
            onClick={onFocusCsvFilePath}
            onKeyPress={onFocusCsvFilePath}
            error={Boolean(errors.csvFilePath)}
            helperText={errors.csvFilePath}
          />
          <br />
          <br />
          <p>
            Enter the location of your{' '}
            <a
              href="https://apps.ankiweb.net/docs/manual.html#files"
              onClick={openInBrowser}
            >
              Anki collection.media folder,
            </a>{' '}
            or wherever you'd like your audio files to be saved.
          </p>
          <TextField
            fullWidth
            label={'Media folder location'}
            value={fields.mediaFolderLocation}
            errorText={errors.mediaFolderLocation}
            onClick={onFocusMediaFolderLocation}
            onKeyPress={onFocusMediaFolderLocation}
            onChange={e => setField('mediaFolderLocation', e.target.value)}
            error={Boolean(errors.mediaFolderLocation)}
            helperText={errors.mediaFolderLocation}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>Cancel</Button>
        <Button onClick={() => onSubmit()}>Ok</Button>
      </DialogActions>
    </Dialog>
  )
}

const mapStateToProps = state => ({
  currentMediaFolderLocation: r.getMediaFolderLocation(state),
})

const mapDispatchToProps = {
  exportCsv: r.exportCsv,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CsvAndMp3ExportDialog)
