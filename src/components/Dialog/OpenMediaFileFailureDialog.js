import React, { useReducer, useCallback } from 'react'
import { connect } from 'react-redux'
import {
  Dialog,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from '@material-ui/core'
import { showOpenDialog } from '../../utils/electron'
import * as r from '../../redux'
import { extname } from 'path'
import {
  reducer,
  getFormState,
  getFieldValue,
  getFieldError,
  setFieldValue,
  setErrors,
} from '../../utils/formState'

const css = {}

const FILE_PATH = 'filePath'

const initialState = getFormState([FILE_PATH])
const validate = state => {
  const errors = {}

  const filePath = getFieldValue(state, FILE_PATH)

  if (!filePath.trim()) errors.filePath = 'Please enter a file location.'

  const errorKeys = Object.keys(errors)
  return errorKeys.length ? errors : null
}

const OpenMediaFileFailureDialog = ({
  open,
  closeDialog,
  message,
  currentMedia,
  locateMediaFileRequest,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { name, isVideo, id } = currentMedia
  // const { name, isVideo, id }: MediaFileMetadata = currentMedia

  const onTextFocus = useCallback(
    async () => {
      const extensions = [extname(name).replace('.', '')]
      const filePaths = await showOpenDialog([
        { name: isVideo ? 'Video file' : 'Audio file', extensions },
      ])
      if (!filePaths) return

      const [filePath] = filePaths
      dispatch(setFieldValue(FILE_PATH, filePath))
    },
    [name, isVideo]
  )
  const handleSubmit = useCallback(
    e => {
      e.preventDefault()

      const errors = validate(state)

      if (errors) {
        dispatch(setErrors(errors))
      } else {
        locateMediaFileRequest(id, getFieldValue(state, FILE_PATH).trim())
        closeDialog()
      }
    },
    [id, state, locateMediaFileRequest, closeDialog]
  )

  const errorText = getFieldError(state, FILE_PATH)

  return (
    <Dialog open={open}>
      <DialogContent>
        <p style={{ whiteSpace: 'pre-wrap' }}>{message}</p>

        <form className={css.form}>
          <TextField
            className={css.textField}
            value={getFieldValue(state, FILE_PATH)}
            onClick={onTextFocus}
            onKeyPress={onTextFocus}
            error={Boolean(errorText)}
            helperText={errorText}
            fullWidth
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>Cancel</Button>
        <Button onClick={handleSubmit}>Continue</Button>
      </DialogActions>
    </Dialog>
  )
}

const mapStateToProps = state => ({
  currentMedia: r.getCurrentMediaFileRecord(state),
})

const mapDispatchToProps = {
  locateMediaFileRequest: r.locateMediaFileRequest,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(OpenMediaFileFailureDialog)
