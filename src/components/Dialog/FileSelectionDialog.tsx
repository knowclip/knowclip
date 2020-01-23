import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Dialog, DialogContent } from '@material-ui/core'
import FileSelectionForm from '../FileSelectionForm'
import { getExtensions, getHumanFileName } from '../../utils/files'
import * as actions from '../../actions'
import { DialogProps } from './DialogProps'

const FileSelectionDialog = ({
  open,
  data: { message, file },
}: DialogProps<FileSelectionDialogData>) => {
  const dispatch = useDispatch()

  const onSubmit = useCallback(
    path => {
      dispatch(actions.locateFileSuccess(file, path))
      dispatch(actions.closeDialog())
    },
    [dispatch, file]
  )
  const openFileFailure = useCallback(
    () => {
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
    },
    [dispatch, file]
  )
  return (
    <Dialog open={open}>
      <DialogContent>
        <FileSelectionForm
          message={message}
          onSubmit={onSubmit}
          extensions={getExtensions(file)}
          cancel={openFileFailure}
        />
      </DialogContent>
    </Dialog>
  )
}

export default FileSelectionDialog
