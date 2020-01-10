import React, { useCallback, useState } from 'react'
import { TextField, Button } from '@material-ui/core'
import * as css from './FileSelectionForm.module.css'
import { showOpenDialog } from '../utils/electron'

const useLocationForm = (extensions, onSubmit) => {
  const [locationText, setLocationText] = useState('')
  const [errorText, setErrorText] = useState('')

  const fillInLocation = useCallback(text => {
    setLocationText(text)
    setErrorText('')
  }, [])
  const onLocationTextFocus = useCallback(
    async e => {
      const filePaths = await showOpenDialog(
        extensions.map(ext => ({ name: 'File', extensions: ext }))
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

const FileSelectionForm = ({ message, cancel, extensions, onSubmit }) => {
  const {
    locationText,
    errorText,
    onLocationTextFocus,
    handleSubmit,
  } = useLocationForm(extensions, onSubmit)

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
        <p className={css.buttons}>
          <Button onClick={cancel}>Cancel</Button>
          <Button onClick={handleSubmit}>Continue</Button>
        </p>
      </form>
    </section>
  )
}
export default FileSelectionForm
