import React, { ReactNode, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  Tooltip,
} from '@mui/material'
import { DialogProps } from './DialogProps'
import r from '../../redux'
import { Delete, Warning } from '@mui/icons-material'
import { openInBrowser } from '../../utils/electron'
import { useLocalSettingsReducer } from './SettingsDialog'

enum $ {
  container = 'dictionaries-dialog',
}
export { $ as dictionariesDialog$ }

const DictionariesDialog = ({ open }: DialogProps<DictionariesDialogData>) => {
  const dispatch = useDispatch()
  const { settings, dispatchLocal } = useLocalSettingsReducer()
  const closeAndSaveSettings = useCallback(() => {
    dispatch(r.closeDialog())
    dispatch(r.overrideSettings(settings))
  }, [dispatch, settings])
  const { dictionaryFiles, progress } = useSelector((state: AppState) => ({
    dictionaryFiles: r.getOpenDictionaryFiles(state),
    progress: state.session.progress,
  }))

  const isLoading = Boolean(progress)

  const onClickDelete = useCallback(
    (id: string) => {
      dispatch(
        r.confirmationDialog(
          `This action may take a few minutes to complete. Are you sure you want to delete this dictionary data at this moment?`,
          r.deleteFileRequest('Dictionary', id),
          null,
          true
        )
      )
    },
    [dispatch]
  )

  const [newDictionaryType, setNewDictionaryType] = useState<
    DictionaryFileType | ''
  >('')

  const handleClickImportDictionaryFile = useCallback(() => {
    if (!newDictionaryType)
      return dispatch(
        r.simpleMessageSnackbar(
          'Please select the type of dictionary you wish to import.'
        )
      )
    dispatch(
      r.confirmationDialog(
        `Are you sure you want to import a dictionary right now? You won't be able to use the app while the import is in progress.`,
        r.importDictionaryRequest(newDictionaryType),
        null,
        true
      )
    )
  }, [newDictionaryType, dispatch])

  const handleClickDeleteDatabase = useCallback(() => {
    dispatch(
      r.confirmationDialog(
        `Are you sure you want to delete the entire dictionaries database? You will have to import any dictionaries you've added again.`,
        r.resetDictionariesDatabase(),
        null,
        true
      )
    )
  }, [dispatch])

  const onChange = useCallback(
    (id: string, dictionaryType: DictionaryFileType) =>
      dispatchLocal(
        settings.activeDictionaries &&
          settings.activeDictionaries.some(
            (d) => d.id === id && d.type === dictionaryType
          )
          ? r.removeActiveDictionary(id)
          : r.addActiveDictionary(id, dictionaryType)
      ),
    [dispatchLocal, settings.activeDictionaries]
  )
  return (
    <Dialog open={open} className={$.container}>
      <DialogContent>
        <div style={{ minWidth: '500px' }}>
          {progress && progress.message.toLowerCase().includes('import') && (
            <>
              <p>Please wait a moment while your dictionary loads.</p>

              <p>This can take several minutes or longer on some computers.</p>

              <section style={{ textAlign: 'center' }}>
                <LinearProgress
                  value={progress.percentage}
                  variant="determinate"
                />
              </section>

              <p>
                After this import is finished, the dictionary will be available
                instantly each time you open up Knowclip.
              </p>
            </>
          )}
          {progress && !progress.message.toLowerCase().includes('import') && (
            <>
              <p>Please wait a moment while this operation completes.</p>

              <p>This can take several minutes or longer on some computers.</p>

              <section style={{ textAlign: 'center' }}>
                <CircularProgress />
              </section>
            </>
          )}
          {!isLoading && (
            <>
              <h3>
                Imported dictionaries:{' '}
                <Button
                  onClick={handleClickDeleteDatabase}
                  size="small"
                  style={{ float: 'right' }}
                >
                  (Reset database)
                </Button>
              </h3>
              {!dictionaryFiles.length && (
                <p>You haven't added any dictionaries yet.</p>
              )}
              <List>
                {dictionaryFiles.map(({ file, availability }) => {
                  return (
                    <DictionaryFileItem
                      key={file.id}
                      {...{
                        availability,
                        file,
                        onClickDelete,
                        onChange,
                        selected: Boolean(
                          settings.activeDictionaries &&
                            settings.activeDictionaries.some(
                              (d) => d.id === file.id
                            )
                        ),
                      }}
                    />
                  )
                })}
              </List>

              <p>
                <Select
                  displayEmpty
                  onChange={(event) => {
                    setNewDictionaryType(event.target.value as any)
                  }}
                  value={newDictionaryType}
                >
                  <MenuItem value={''}>Add a new dictionary of type:</MenuItem>
                  {r.dictionaryTypes.map((type) => {
                    return (
                      <MenuItem key={type} value={type}>
                        {r.displayDictionaryType(type)}
                      </MenuItem>
                    )
                  })}
                </Select>
              </p>

              {newDictionaryType && (
                <DictionaryInstructions
                  {...{
                    dictionaryType: newDictionaryType as DictionaryFileType,
                    button: (
                      <Button
                        color="primary"
                        variant="contained"
                        onClick={handleClickImportDictionaryFile}
                      >
                        Import dictionary .zip file
                      </Button>
                    ),
                  }}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>

      <DialogActions>
        {!isLoading && <Button onClick={closeAndSaveSettings}>Close</Button>}
      </DialogActions>
    </Dialog>
  )
}
export default DictionariesDialog

function DictionaryFileItem({
  availability,
  file,
  onClickDelete,
  onChange,
  selected,
}: {
  availability: FileAvailability
  file: DictionaryFile
  onClickDelete: (id: string) => void
  onChange: (id: string, dictionaryType: DictionaryFileType) => void
  selected: boolean
}) {
  const handleClickDelete = useCallback(
    () => onClickDelete(availability.id),
    [availability.id, onClickDelete]
  )
  const handleChange = useCallback(
    () => onChange(file.id, file.dictionaryType),
    [onChange, file.id, file.dictionaryType]
  )
  return (
    <ListItem key={availability.id} value={file.id}>
      {!file.importComplete && <ImportInterruptedListIcon />}
      <ListItemIcon>
        <Checkbox checked={selected} onChange={handleChange} />
      </ListItemIcon>
      <ListItemText
        primary={`${r.displayDictionaryType(file.dictionaryType)}`}
        secondary={file.name}
        title={availability.filePath || ''}
      />
      <ListItemSecondaryAction>
        <IconButton onClick={handleClickDelete}>
          <Delete />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  )
}

const DICT_CC_DOWNLOAD_URL = `https://www1.dict.cc/translation_file_request.php`
const YOMICHAN_JMDICT_DOWNLOAD_URL = `https://github.com/knowclip/knowclip/releases/download/v0.7.25-beta/Japanese_English_Dictionary__jmdict_english.zip`
const YOMICHAN_SITE_URL = `https://foosoft.net/projects/yomichan/index.html#dictionaries`
const CEDICT_DOWNLOAD_URL = `https://github.com/knowclip/knowclip/releases/download/v0.7.25-beta/Chinese_English_Dictionary__cedict_1_0_ts_utf-8_mdbg.zip`
const CEDICT_SITE_URL = `https://www.mdbg.net/chinese/dictionary?page=cc-cedict`

export function DictionaryInstructions({
  dictionaryType,
  button,
}: {
  dictionaryType: DictionaryFileType
  button: ReactNode
}) {
  switch (dictionaryType) {
    case 'DictCCDictionary':
      return (
        <>
          <p>
            The wonderful online German dictionary dict.cc makes their entire
            dictionary available for free on their web site.
          </p>
          <h3 style={{ textAlign: 'center' }}>Step 1:</h3>
          <p>
            Open this link in your internet browser and follow the download
            instructions:{' '}
            <a onClick={openInBrowser} href={DICT_CC_DOWNLOAD_URL}>
              {DICT_CC_DOWNLOAD_URL}
            </a>
          </p>
          <p>
            After providing an e-mail address, you'll receive instructions on
            how to proceed to downloading the .ZIP file.{' '}
            <strong>Remember what folder you download it into!</strong>
          </p>

          <h3 style={{ textAlign: 'center' }}>Step 2:</h3>
          <p>
            Once you've received the ZIP file, you may push the button below to
            import it into Knowclip.
          </p>
          <section style={{ textAlign: 'center' }}>{button}</section>
        </>
      )
    case 'YomichanDictionary':
      return (
        <>
          <p>
            This Japanese-English dictionary data is a mirror of the Yomichan
            Japanese-English dictionary, which you may have already downloaded
            with the popular Chrome extension.
          </p>
          <h3 style={{ textAlign: 'center' }}>Step 1:</h3>
          <p>
            Download the Japanese-English dictionary from this link:
            <br />
            <a onClick={openInBrowser} href={YOMICHAN_JMDICT_DOWNLOAD_URL}>
              {YOMICHAN_JMDICT_DOWNLOAD_URL}
            </a>
            <details>
              <summary>Other languages (experimental)</summary>
              <section>
                <p>
                  For other languages than English, you may try using any of the{' '}
                  <strong>JMDict</strong> files from the Yomichan site, but
                  these haven't been tested with Knowclip.
                </p>
                <p>
                  Japanese - Other languages download link:{' '}
                  <a onClick={openInBrowser} href={YOMICHAN_SITE_URL}>
                    {YOMICHAN_SITE_URL}
                  </a>
                </p>
              </section>
            </details>
          </p>
          <h3 style={{ textAlign: 'center' }}>Step 2:</h3>
          <p>
            Once the .ZIP file is finished downloading, press the button below
            and point to the .ZIP file you just downloaded.
          </p>
          <section style={{ textAlign: 'center' }}>{button}</section>
        </>
      )
    case 'CEDictDictionary':
      return (
        <>
          <p>
            This Chinese-English dictionary data is a mirror of the data from
            the MDBG dictionary, used in popular apps like Pleco.
          </p>
          <h3 style={{ textAlign: 'center' }}>Step 1:</h3>
          <p style={{ textAlign: 'center' }}>
            Download the Chinese-English dictionary from this link:
            <br />
            <a onClick={openInBrowser} href={CEDICT_DOWNLOAD_URL}>
              {CEDICT_DOWNLOAD_URL}
            </a>
          </p>

          <p>
            The MDBG data is updated frequently. As an alternative to the link
            above, you can get the latest version of the MDBG dictionary data at
            the link below. Just be warned it may not have been tested with
            Knowclip.
          </p>
          <p>
            Latest Chinese - English download link:{' '}
            <a onClick={openInBrowser} href={CEDICT_SITE_URL}>
              {CEDICT_SITE_URL}
            </a>
          </p>

          <h3 style={{ textAlign: 'center' }}>Step 2:</h3>
          <p>
            Once the .ZIP file is finished downloading, press the IMPORT
            DICTIONARY button and point to the file in your download folder.
          </p>
          <section style={{ textAlign: 'center' }}>{button}</section>
        </>
      )
  }
}

export function ImportInterruptedListIcon() {
  return (
    <Tooltip title="Import was interrupted. May not function correctly.">
      <ListItemIcon>
        <Warning />
      </ListItemIcon>
    </Tooltip>
  )
}
