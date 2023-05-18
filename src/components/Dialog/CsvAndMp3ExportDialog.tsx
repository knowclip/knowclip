import React, { useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import r from '../../redux'
import {
  showOpenDirectoryDialog,
  showSaveDialog,
  openInBrowser,
} from '../../utils/electron'

import { actions } from '../../actions'
import { DialogProps } from './DialogProps'

type ErrorsState = {
  csvFilePath?: string
  mediaFolderLocation?: string
}

enum $ {
  container = 'csv-and-mp3-export-dialog',
}
export { $ as csvAndMp3ExportDialog$ }

const CsvAndMp3ExportDialog = ({
  open,
  data: { mediaFileIdsToClipIds },
}: DialogProps<CsvAndMp3ExportDialogData>) => {
  const { currentMediaFolderLocation } = useSelector((state: AppState) => ({
    currentMediaFolderLocation: r.getMediaFolderLocation(state),
  }))

  const dispatch = useDispatch()

  const [fields, setFields] = useState({
    mediaFolderLocation: currentMediaFolderLocation || '',
    csvFilePath: '',
  })
  const setField = useCallback((key: keyof typeof fields, value: string) => {
    setErrors((errors) => ({ ...errors, [key]: null }))
    setFields((fields) => ({
      ...fields,
      [key]: value,
    }))
  }, [])
  const [errors, setErrors] = useState<ErrorsState>({})
  const [rememberLocation, setRememberLocation] = useState(true)
  const toggleRememberLocation = useCallback(() => {
    setRememberLocation((l) => !l)
  }, [setRememberLocation])

  const onSubmit = useCallback(
    (_e) => {
      const { csvFilePath, mediaFolderLocation } = fields
      if (csvFilePath && mediaFolderLocation) {
        dispatch(actions.closeDialog())
        return dispatch(
          actions.exportCsv(
            mediaFileIdsToClipIds,
            csvFilePath,
            mediaFolderLocation,
            rememberLocation
          )
        )
      }
      const errors: ErrorsState = {}
      if (!csvFilePath)
        errors.csvFilePath =
          'Please choose a location to save your flashcards file.'
      if (!mediaFolderLocation)
        errors.mediaFolderLocation =
          'Please choose a location to save your audio clips.'
      setErrors(errors)
    },
    [dispatch, mediaFileIdsToClipIds, fields, rememberLocation]
  )

  const onFocusMediaFolderLocation = useCallback(
    async (_e) => {
      const directoryPath = await showOpenDirectoryDialog()
      if (directoryPath) setField('mediaFolderLocation', directoryPath)
    },
    [setField]
  )

  const onFocusCsvFilePath = useCallback(
    async (_e) => {
      const filePath = await showSaveDialog('Comma-separated values', ['csv'])
      if (filePath) setField('csvFilePath', filePath)
    },
    [setField]
  )

  return (
    <Dialog open={open} className={$.container}>
      <DialogContent>
        <form
          onSubmit={useCallback(
            (e) => {
              e.preventDefault()
              onSubmit(e)
            },
            [onSubmit]
          )}
        >
          <TextField
            fullWidth
            label={'CSV file location'}
            value={fields.csvFilePath}
            onChange={useCallback(
              (e) => setField('csvFilePath', e.target.value),
              [setField]
            )}
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
            onClick={onFocusMediaFolderLocation}
            onKeyPress={onFocusMediaFolderLocation}
            onChange={useCallback(
              (e) => setField('mediaFolderLocation', e.target.value),
              [setField]
            )}
            error={Boolean(errors.mediaFolderLocation)}
            helperText={errors.mediaFolderLocation}
          />
          <FormControl fullWidth margin="normal">
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberLocation}
                  onChange={toggleRememberLocation}
                  color="primary"
                />
              }
              label="Remember this folder as my Anki collection.media folder"
            />
          </FormControl>
        </form>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={(_e) => dispatch(actions.closeDialog())}
          color="primary"
        >
          Cancel
        </Button>
        <Button onClick={onSubmit} color="primary">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CsvAndMp3ExportDialog
