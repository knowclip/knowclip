import React, { useCallback, useState } from 'react'
import { TextField, Button } from '@material-ui/core'
import css from './FileSelectionForm.module.css'
import { showOpenDialog } from '../utils/electron'

enum $ {
  container = 'file-selection-form-container',
  filePathField = 'file-selection-form-file-path-field',
  cancelButton = 'file-selection-form-cancel-button',
  continueButton = 'file-selection-form-continue-button',
}

const FileSelectionForm = ({
  message,
  cancel,
  extensions,
  onSubmit,
}: {
  message: string
  cancel: () => void
  extensions: string[]
  onSubmit: (path: string) => void
}) => {
  const {
    locationText,
    errorText,
    onLocationTextFocus,
    handleSubmit,
  } = useLocationForm(extensions, onSubmit)

  return (
    <section className={css.container} id={$.container}>
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
        />
        <p className={css.buttons}>
          <Button onClick={cancel} id={$.cancelButton}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} id={$.continueButton}>
            Continue
          </Button>
        </p>
      </form>
    </section>
  )
}
const useLocationForm = (
  extensions: string[],
  onSubmit: (string: string) => void
) => {
  const [locationText, setLocationText] = useState('')
  const [errorText, setErrorText] = useState('')

  const fillInLocation = useCallback(text => {
    setLocationText(text)
    setErrorText('')
  }, [])
  const onLocationTextFocus = useCallback(
    async e => {
      const filePaths = await showOpenDialog(
        extensions.map(ext => ({ name: 'File', extensions: [ext] }))
      )

      if (!filePaths) return

      const [directory] = filePaths
      fillInLocation(directory)
    },
    [extensions, fillInLocation]
  )
  const handleSubmit = useCallback(
    e => {
      if (locationText) {
        onSubmit(locationText)
      } else {
        setErrorText('Please choose a location to continue.')
      }
    },
    [locationText, onSubmit]
  )

  return {
    locationText,
    errorText,
    onLocationTextFocus,
    handleSubmit,
  }
}

export default FileSelectionForm

export { $ as fileSelectionForm$ }
