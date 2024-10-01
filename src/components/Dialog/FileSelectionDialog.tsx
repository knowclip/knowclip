import React, { useCallback, useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Button,
} from '@mui/material'
import { getHumanFileName, getFileFilters } from '../../utils/files'
import { actions } from '../../actions'
import { DialogProps } from './DialogProps'
import css from './FileSelectionForm.module.css'
import { dirname } from '../../utils/rendererPathHelpers'
import { showOpenDialog } from '../../utils/electron'
import { getFileAvailability } from '../../selectors'

import { fileSelectionDialog$ as $ } from './FileSelectionDialog.testLabels'

const FileSelectionDialog = ({
  open,
  data: { message, file },
}: DialogProps<FileSelectionDialogData>) => {
  const dispatch = useDispatch()

  const onSubmit: (string: string) => void = useCallback(
    (path) => {
      dispatch(actions.locateFileSuccess(file, path))
      dispatch(actions.closeDialog())
    },
    [dispatch, file]
  )

  const availability = useSelector((state: AppState) =>
    getFileAvailability(state, file)
  )

  const {
    locationText,
    errorText,
    onLocationTextFocus,
    handleSubmit,
    checkFolderAutomatically,
    toggleCheckFolderAutomatically,
  } = useLocationForm(getFileFilters(file.type), onSubmit)

  const cancel = useCallback(() => {
    if (availability.isLoading)
      dispatch(
        actions.openFileFailure(
          file,
          null,
          `Could not locate ${getHumanFileName(
            file
          )}. Some features may be unavailable until it is located.`
        )
      )
    dispatch(actions.closeDialog())
  }, [availability.isLoading, dispatch, file])
  const closeAndGoToSettings = useCallback(() => {
    cancel()
    dispatch(actions.settingsDialog())
  }, [cancel, dispatch])
  // TODO: check if file path exists due to recent change
  //       and close dialog in that case.

  return (
    <Dialog open={open} className={$.container}>
      <DialogContent>
        <section className={css.container} id={$.form}>
          <p className={css.prompt}>{message}</p>
          <form className={css.form}>
            <TextField
              id={$.filePathField}
              className={css.textField}
              value={locationText}
              onClick={onLocationTextFocus}
              onKeyPress={onLocationTextFocus}
              error={Boolean(errorText)}
              helperText={errorText}
              label="File location"
            />

            <FormControl fullWidth margin="normal">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checkFolderAutomatically}
                    onChange={toggleCheckFolderAutomatically}
                    color="primary"
                  />
                }
                label="Check in this folder automatically next time a file is missing"
              />
            </FormControl>
          </form>
        </section>
      </DialogContent>
      <DialogActions className={css.buttons}>
        <Button onClick={closeAndGoToSettings}>Settings</Button>
        <div className={css.buttonsRight}>
          <Button onClick={cancel} id={$.cancelButton} color="primary">
            Cancel
          </Button>

          <Button onClick={handleSubmit} id={$.continueButton} color="primary">
            Continue
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  )
}

const useLocationForm = (
  filters: Electron.FileFilter[],
  onSubmit: (string: string) => void
) => {
  const dispatch = useDispatch()
  const { platform } = window.electronApi

  const [locationText, setLocationText] = useState('')
  const [errorText, setErrorText] = useState('')
  const [checkFolderAutomatically, setCheckFolderAutomatically] =
    useState(false)

  const autoCheckFolders = useSelector(
    (state: AppState) => state.settings.assetsDirectories
  )
  useEffect(() => {
    const trimmedLocation = locationText.trim()
    setCheckFolderAutomatically(
      Boolean(
        trimmedLocation &&
          autoCheckFolders.includes(dirname(platform, trimmedLocation))
      )
    )
  }, [autoCheckFolders, locationText, platform])

  const fillInLocation = useCallback((text: string): void => {
    setLocationText(text)
    setErrorText('')
  }, [])
  const onLocationTextFocus = useCallback(async () => {
    const filePaths = await showOpenDialog(filters)

    if (!filePaths) return

    const [directory] = filePaths
    fillInLocation(directory)
  }, [fillInLocation, filters])
  const handleSubmit = useCallback(() => {
    if (locationText) {
      const directory = dirname(platform, locationText.trim())
      if (autoCheckFolders.includes(directory) && !checkFolderAutomatically)
        dispatch(actions.removeAssetsDirectories([directory]))
      if (!autoCheckFolders.includes(directory) && checkFolderAutomatically)
        dispatch(actions.addAssetsDirectories([directory]))
      onSubmit(locationText)
    } else {
      setErrorText('Please choose a location to continue.')
    }
  }, [
    autoCheckFolders,
    checkFolderAutomatically,
    dispatch,
    locationText,
    onSubmit,
    platform,
  ])

  return {
    locationText,
    errorText,
    checkFolderAutomatically,
    onLocationTextFocus,
    handleSubmit,
    toggleCheckFolderAutomatically: useCallback(() => {
      setCheckFolderAutomatically((checked) => !checked)
    }, [setCheckFolderAutomatically]),
  }
}

export default FileSelectionDialog
