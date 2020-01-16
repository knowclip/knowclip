import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { Dialog, DialogContent } from '@material-ui/core'
import MediaFolderLocationForm from '../MediaFolderLocationForm'
import { DialogProps } from './DialogProps'
import { closeDialog } from '../../actions'

const MediaFolderLocationFormDialog = ({
  open,
  data: { action },
}: DialogProps<MediaFolderLocationFormDialogData>) => {
  const dispatch = useDispatch()
  const dispatchAction = useCallback(
    () => {
      action && dispatch(action)
      dispatch(closeDialog())
    },
    [dispatch, action]
  )

  return (
    <Dialog open={open}>
      <DialogContent>
        <MediaFolderLocationForm onSubmit={dispatchAction} />
      </DialogContent>
    </Dialog>
  )
}

export default MediaFolderLocationFormDialog
