import React, { useCallback } from 'react'
import { TextField } from '@material-ui/core'
import css from './MediaFolderLocationForm.module.css'
import { showOpenDirectoryDialog } from '../utils/electron'

// TODO: extend for files vs. directories
const FilePathTextField = ({
  onSetFilePath,
  value,
  labelText = '',
  errorText = '',
  placeholderText = '',
}: {
  value: string
  labelText?: string
  errorText?: string
  placeholderText?: string
  onSetFilePath: (filePath: string) => void
}) => {
  const onLocationTextFocus = useCallback(async () => {
    const filePaths = await showOpenDirectoryDialog()

    if (!filePaths) return

    const [directory] = filePaths

    onSetFilePath(directory)
  }, [onSetFilePath])

  return (
    <TextField
      className={css.textField}
      value={value}
      onClick={onLocationTextFocus}
      onKeyPress={onLocationTextFocus}
      error={Boolean(errorText)}
      helperText={errorText}
      label={labelText}
      placeholder={placeholderText}
    />
  )
}
export default FilePathTextField
