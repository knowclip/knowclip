import React, { useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TextField, Button } from '@mui/material'
import r from '../redux'
import css from './MediaFolderLocationForm.module.css'
import { showOpenDirectoryDialog, openInBrowser } from '../utils/electron'
import { actions } from '../actions'

const MediaFolderLocationForm = ({ onSubmit }: { onSubmit: () => void }) => {
  const dispatch = useDispatch()
  const { mediaFolderLocation } = useSelector((state: AppState) => ({
    mediaFolderLocation: r.getMediaFolderLocation(state),
  }))
  const [locationText, setJustLocationText] = useState(
    mediaFolderLocation || ''
  )
  const [errorText, setErrorText] = useState('')
  const setLocationText = useCallback(
    (text: string) => {
      setJustLocationText(text)
      setErrorText('')
    },
    [setJustLocationText, setErrorText]
  )

  const onLocationTextFocus = useCallback(async () => {
    const filePaths = await showOpenDirectoryDialog()

    if (!filePaths) return

    const [directory] = filePaths
    setLocationText(directory)
  }, [setLocationText])

  const handleSubmit = useCallback(() => {
    if (locationText) {
      dispatch(actions.setMediaFolderLocation(locationText))
      onSubmit()
    } else {
      setErrorText('Please choose a location to continue.')
    }
  }, [dispatch, locationText, onSubmit, setErrorText])

  return (
    <section className={css.container}>
      <p className={css.prompt}>
        Enter the location of your{' '}
        <a
          href="https://apps.ankiweb.net/docs/manual.html#files"
          onClick={openInBrowser}
        >
          Anki collection.media folder,
        </a>{' '}
        or wherever you'd like your audio files to be saved.
      </p>
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
        </p>
      </form>
    </section>
  )
}

export default MediaFolderLocationForm
