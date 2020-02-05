import React, { useCallback, useReducer, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  DialogTitle,
  Divider,
  ListItemSecondaryAction,
  Paper,
  MenuItem,
  ListItemIcon,
} from '@material-ui/core'
import * as actions from '../../actions'
import { DialogProps } from './DialogProps'
import reducer from '../../reducers/settings'
import FilePathTextField from '../FilePathTextField'
import {
  openInBrowser,
  showOpenDirectoryDialog,
  showOpenDirectoriesDialog,
} from '../../utils/electron'
import css from './SettingsDialog.module.css'
import { Delete, Add } from '@material-ui/icons'
import truncate from '../../utils/truncate'

enum $ {
  cancelButton = 'settings-dialog-cancel-button',
  saveButton = 'settings-dialog-save-button',
}

type FormAction =
  | SetMediaFolderLocation
  | AddAssetsDirectories
  | RemoveAssetsDirectories

const SettingsDialog = ({ open }: DialogProps<SettingsDialogData>) => {
  const dispatch = useDispatch()

  const originalSettingsState = useSelector((state: AppState) => state.settings)

  const [settings, dispatchLocal] = useReducer(reducer, originalSettingsState)
  const addAssetsDirectories = useCallback(async () => {
    const paths = await showOpenDirectoriesDialog()
    if (!paths) return

    dispatchLocal(actions.addAssetsDirectories(paths))
  }, [])

  const close = useCallback(() => dispatch(actions.closeDialog()), [dispatch])
  const saveSettings = useCallback(
    () => {
      dispatch(actions.overrideSettings(settings))
      close()
    },
    [close, dispatch, settings]
  )

  return (
    <Dialog open={open} fullScreen>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent className={css.container}>
        <section className={css.settingsGroup}>
          <Paper className={css.settingsGroupBody}>
            <h3 className={css.heading}>Media import folders</h3>
            <List>
              {settings.assetsDirectories.map(path => {
                return (
                  <ListItem key={path} dense>
                    <ListItemText primary={truncate(path, 100)} title={path} />
                    <ListItemSecondaryAction>
                      <RemoveAssetsDirectoryButton
                        path={path}
                        removeAssetsDirectory={path =>
                          dispatchLocal(actions.removeAssetsDirectories([path]))
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              })}
              <MenuItem onClick={addAssetsDirectories}>
                <ListItemIcon>
                  <Add />
                </ListItemIcon>
                <ListItemText>Add folder</ListItemText>
              </MenuItem>
            </List>
          </Paper>

          <section className={css.settingsGroupDescription}>
            <p>
              Next time you try opening a file that was recently moved, Knowclip
              will search in these folders automatically for it.
            </p>

            <p>
              Only the contents of folders list here will be searched. Any
              subfolders within them won't be included.
            </p>
          </section>
        </section>

        <section className={css.settingsGroup}>
          <Paper className={css.settingsGroupBody}>
            <h3 className={css.heading}>Media export folder</h3>
            <FormControl className={css.formControl} margin="normal" fullWidth>
              <FilePathTextField
                value={settings.mediaFolderLocation || ''}
                onSetFilePath={useCallback(
                  filePath =>
                    dispatchLocal(actions.setMediaFolderLocation(filePath)),
                  [dispatchLocal]
                )}
                placeholderText="Click to set location"
              />
            </FormControl>
          </Paper>

          <section className={css.settingsGroupDescription}>
            {' '}
            <p>
              The location of your{' '}
              <a
                href="https://apps.ankiweb.net/docs/manual.html#files"
                onClick={openInBrowser}
              >
                Anki collection.media folder
              </a>
              , or wherever you'd like your exported mp3 and image files to be
              saved.
            </p>
            <p>(Does not apply to Anki deck .apkg exports.)</p>
          </section>
        </section>
      </DialogContent>

      <DialogActions>
        <Button onClick={close} id={$.cancelButton} color="primary">
          Cancel
        </Button>
        <Button
          onClick={saveSettings}
          id={$.saveButton}
          type="submit"
          color="primary"
        >
          Save settings
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const RemoveAssetsDirectoryButton = ({
  path,
  removeAssetsDirectory,
}: {
  path: string
  removeAssetsDirectory: (path: string) => void
}) => (
  <IconButton onClick={() => removeAssetsDirectory(path)}>
    <Delete />
  </IconButton>
)

export default SettingsDialog

export { $ as settingsDialog$ }
