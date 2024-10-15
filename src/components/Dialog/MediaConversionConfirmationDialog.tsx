import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
} from '@mui/material'
import { actions } from '../../actions'
import { DialogProps } from './DialogProps'

import { confirmationDialog$ as $ } from './Confirmation.testLabels'
import { useLocalSettingsReducer } from './SettingsDialog'

const MediaConversionConfirmationDialog = ({
  open,
  data: { message, action, onCancel },
}: DialogProps<MediaConversionConfirmationDialogData>) => {
  const dispatch = useDispatch()
  const { settings, dispatchLocal } = useLocalSettingsReducer({
    listenToUpstreamUpdates: false,
  })

  const dispatchAction = useCallback(() => {
    dispatch(actions.overrideSettings(settings))
    dispatch(actions.closeDialog())
    dispatch(action)
  }, [dispatch, action, settings])

  const cancel = useCallback(() => {
    dispatch(actions.overrideSettings(settings))
    dispatch(actions.closeDialog())
    onCancel && dispatch(onCancel)
  }, [dispatch, onCancel, settings])

  const handleChangeCheckbox = () => {
    dispatchLocal(
      actions.setWarnBeforeConvertingMedia(!settings.warnBeforeConvertingMedia)
    )
  }

  return (
    <Dialog open={open} className={$.container}>
      <DialogContent style={{ whiteSpace: 'pre-line' }}>
        {message}
        <br />
        <FormControl fullWidth margin="normal">
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.warnBeforeConvertingMedia}
                onChange={handleChangeCheckbox}
                color="primary"
              />
            }
            label="Always ask before converting media"
          />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={cancel} id={$.cancelButton} color="primary">
          Cancel
        </Button>
        <Button onClick={dispatchAction} id={$.okButton} color="primary">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MediaConversionConfirmationDialog
