import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Dialog, DialogContent } from '@mui/material'
import MediaFolderLocationForm from '../MediaFolderLocationForm'
import { DialogProps } from './DialogProps'
import { actions } from '../../actions'

enum $ {
  container = 'media-folder-location-form-dialog',
}
export { $ as mediaFolderLocationFormDialog$ }

const MediaFolderLocationFormDialog = ({
  open,
  data: { action },
}: DialogProps<MediaFolderLocationFormDialogData>) => {
  const dispatch = useDispatch()
  const dispatchAction = useCallback(() => {
    action && dispatch(action)
    dispatch(actions.closeDialog())
  }, [dispatch, action])

  return (
    <Dialog open={open} className={$.container}>
      <DialogContent>
        <MediaFolderLocationForm onSubmit={dispatchAction} />
      </DialogContent>
    </Dialog>
  )
}

export default MediaFolderLocationFormDialog
