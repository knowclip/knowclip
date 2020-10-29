import React, { useCallback, useReducer } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  FormControl,
  List,
  ListItem,
  ListItemText,
  DialogTitle,
  ListItemSecondaryAction,
  Paper,
  MenuItem,
  ListItemIcon,
  FormControlLabel,
  Checkbox,
} from '@material-ui/core'
import { actions } from '../../actions'
import * as selectors from '../../selectors'
import { DialogProps } from './DialogProps'
import reducer from '../../reducers/settings'
import FilePathTextField from '../FilePathTextField'
import { openInBrowser, showOpenDirectoriesDialog } from '../../utils/electron'
import css from './SettingsDialog.module.css'
import { Delete, Add } from '@material-ui/icons'
import truncate from '../../utils/truncate'
import { displayDictionaryType } from '../../selectors'
import { ImportInterruptedListIcon } from './DictionariesDialog'

enum $ {
  cancelButton = 'settings-dialog-cancel-button',
  saveButton = 'settings-dialog-save-button',
}

const SettingsDialog = ({ open }: DialogProps<SettingsDialogData>) => {
  const dispatch = useDispatch()

  const { dictionaryFiles } = useSelector((state: AppState) => ({
    dictionaryFiles: selectors.getOpenDictionaryFiles(state),
  }))

  const { settings, dispatchLocal } = useLocalSettingsReducer()
  const addAssetsDirectories = useCallback(async () => {
    const paths = await showOpenDirectoriesDialog()
    if (!paths) return

    dispatchLocal(actions.addAssetsDirectories(paths))
  }, [dispatchLocal])

  const close = useCallback(() => dispatch(actions.closeDialog()), [dispatch])
  const saveSettings = useCallback(() => {
    dispatch(actions.overrideSettings(settings))
    close()
  }, [close, dispatch, settings])

  return (
    <Dialog open={open} fullScreen>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent className={css.container}>
        <section className={css.settingsGroup}>
          <Paper className={css.settingsGroupBody}>
            <h3 className={css.heading}>Media import folders</h3>
            <List>
              {settings.assetsDirectories.map((path) => {
                return (
                  <ListItem key={path} dense>
                    <ListItemText primary={truncate(path, 100)} title={path} />
                    <ListItemSecondaryAction>
                      <RemoveAssetsDirectoryButton
                        path={path}
                        removeAssetsDirectory={(path) =>
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
                  (filePath) =>
                    dispatchLocal(actions.setMediaFolderLocation(filePath)),
                  [dispatchLocal]
                )}
                placeholderText="Click to set location"
              />
            </FormControl>
          </Paper>

          <section className={css.settingsGroupDescription}>
            <p>
              This should be the location of your{' '}
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

        <section className={css.settingsGroup}>
          <Paper className={css.settingsGroupBody}>
            <h3 className={css.heading}>Software updates</h3>
            <FormControl className={css.formControl} fullWidth margin="normal">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={settings.checkForUpdatesAutomatically}
                    onChange={useCallback(
                      (e) =>
                        dispatchLocal(
                          actions.setCheckForUpdatesAutomatically(
                            e.target.checked
                          )
                        ),
                      [dispatchLocal]
                    )}
                    color="primary"
                  />
                }
                label="Check for updates on automatically on startup"
              />
            </FormControl>
          </Paper>

          <section className={css.settingsGroupDescription}>
            <p>
              Check this box if you want to be notified when you're running
              outdated software. Knowclip will check for updates over the
              network each time you open the app.
            </p>
          </section>
        </section>

        <section className={css.settingsGroup}>
          <Paper className={css.settingsGroupBody}>
            <h3 className={css.heading}>Pop-up dictionary</h3>
            <List>
              {!dictionaryFiles.length && (
                <ListItem value={undefined}>
                  You haven't imported any dictionaries yet.
                </ListItem>
              )}
              {dictionaryFiles.map(({ file, availability }) => {
                const activeDictionaries = settings.activeDictionaries || []
                console.log({ activeDictionaries, settings })
                const selected =
                  Boolean(activeDictionaries) &&
                  activeDictionaries.some(
                    (f) => f.id === file.id && f.type === file.dictionaryType
                  )
                return (
                  <ListItem value={file.id} selected={selected}>
                    {!file.importComplete && <ImportInterruptedListIcon />}
                    <ListItemIcon>
                      <Checkbox
                        checked={selected}
                        tabIndex={-1}
                        onChange={(e) =>
                          dispatchLocal(
                            selected
                              ? actions.removeActiveDictionary(file.id)
                              : actions.addActiveDictionary(
                                  file.id,
                                  file.dictionaryType
                                )
                          )
                        }
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${displayDictionaryType(file.dictionaryType)}`}
                      secondary={file.name}
                    />
                  </ListItem>
                )
              })}
            </List>
            <p style={{ margin: '1em' }}>
              <Button onClick={() => dispatch(actions.dictionariesDialog())}>
                Manage dictionaries
              </Button>
            </p>
          </Paper>

          <section className={css.settingsGroupDescription}>
            <p>
              Import a free dictionary so you can look up words quickly inside
              the Knowclip app.
            </p>
            <p>
              Dictionaries aren't bundled with Knowclip automatically because
              they take up lots of disk space. You may import a free dictionary
              of your choice, according to your needs.
            </p>
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

export function useLocalSettingsReducer() {
  const { originalSettingsState } = useSelector((state: AppState) => ({
    originalSettingsState: state.settings,
  }))

  const [settings, dispatchLocal] = useReducer(reducer, originalSettingsState)
  return {
    settings,
    dispatchLocal,
  }
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
