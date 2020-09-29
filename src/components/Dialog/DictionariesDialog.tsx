// dictionaries wont get deleted after close app
// parse fails after "CC" in onomappu video

import React, {
  ReactChildren,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Menu,
  MenuItem,
  Select,
  TextField,
} from '@material-ui/core'
import { DialogProps } from './DialogProps'
import { closeDialog } from '../../actions'
import * as r from '../../redux'
import { Add, Delete } from '@material-ui/icons'
import { dictionaryTypes, displayDictionaryType } from '../../redux'
import { openInBrowser, showOpenDialog } from '../../utils/electron'
import { getFileFilters } from '../../utils/files'
import { basename } from 'path'
import uuid from 'uuid'

const DictionariesDialog = ({ open }: DialogProps<DictionariesDialogData>) => {
  const dispatch = useDispatch()
  const close = useCallback(() => dispatch(r.closeDialog()), [])
  const { dictionaryFiles, workIsUnsaved } = useSelector((state: AppState) => ({
    dictionaryFiles: r.getOpenDictionaryFiles(state),
    workIsUnsaved: r.isWorkUnsaved(state),
  }))

  const [
    loadingNewDictionary,
    setLoadingNewDictionary,
  ] = useState<DictionaryFile | null>(null)
  const isLoading = Boolean(loadingNewDictionary)

  useEffect(
    () => {
      loadingNewDictionaryEffect(
        loadingNewDictionary,
        dictionaryFiles,
        setLoadingNewDictionary
      )
    },
    [loadingNewDictionary, dictionaryFiles]
  )

  const onClickDelete = useCallback((type: DictionaryFileType, id: string) => {
    dispatch(
      r.confirmationDialog(
        `This action may take a few minutes to complete. Are you sure you want to delete this dictionary data at this moment?`,
        r.deleteFileRequest(type, id)
      )
    )
  }, [])

  const [newDictionaryType, setNewDictionaryType] = useState<
    DictionaryFileType | ''
  >('')

  const handleClickImportDictionaryFile = useCallback(
    () => {
      if (!newDictionaryType)
        return dispatch(
          r.simpleMessageSnackbar(
            'Please select the type of dictionary you wish to import.'
          )
        )
      showOpenDialog(getFileFilters(newDictionaryType)).then(files => {
        if (!files) return

        const [filePath] = files
        if (workIsUnsaved)
          dispatch(
            r.simpleMessageSnackbar(
              `Please save your work before trying to import a dictionary.`
            )
          )
        else {
          const indexedIds = dictionaryFiles.map(d => +d.file.id)
          let newIndexedId: number = Math.floor(Math.random() * 10000)
          while (indexedIds.includes(newIndexedId)) {
            newIndexedId = Math.floor(Math.random() * 10000)
          }

          const newFile: DictionaryFile = {
            type: newDictionaryType,
            name: basename(filePath),
            id: String(newIndexedId),
          }
          console.log({ newFile })
          setLoadingNewDictionary(newFile)
          dispatch(r.openFileRequest(newFile, filePath))
        }
      })
    },
    [newDictionaryType, workIsUnsaved, dictionaryFiles]
  )

  return (
    <Dialog open={open}>
      <DialogContent>
        {isLoading && (
          <>
            <p>Please wait a moment while your dictionary loads.</p>

            <p>This should take just a couple minutes.</p>

            <section style={{ textAlign: 'center' }}>
              <CircularProgress />
            </section>

            <p>
              After this import is finished, the dictionary will be available
              instantly after you open up Knowclip.
            </p>
          </>
        )}
        {!isLoading && (
          <>
            <h3>Add/remove dictionaries</h3>
            {!dictionaryFiles.length && (
              <p>You haven't added any dictionaries yet.</p>
            )}
            {dictionaryFiles.map(({ file, availability }) => {
              return (
                <DictionaryFileItem
                  {...{ availability, file, onClickDelete }}
                />
              )
            })}

            <p>
              <Select
                displayEmpty
                onChange={event => {
                  setNewDictionaryType(event.target.value as any)
                }}
                value={newDictionaryType}
              >
                <MenuItem value={''}>Add a new dictionary of type:</MenuItem>
                {dictionaryTypes.map(type => {
                  return (
                    <MenuItem key={type} value={type}>
                      {displayDictionaryType(type)}
                    </MenuItem>
                  )
                })}
              </Select>
            </p>

            {newDictionaryType && (
              <>
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
              </>
            )}
          </>
        )}
      </DialogContent>
      {/* TODO: DELETE ALL BUTTON */}
      <DialogActions>
        {!isLoading && <Button onClick={close}>Close</Button>}
      </DialogActions>
    </Dialog>
  )
}
export default DictionariesDialog

function loadingNewDictionaryEffect(
  loadingNewDictionary:
    | YomichanDictionary
    | CEDictDictionary
    | DictCCDictionary
    | null,
  dictionaryFiles: { file: DictionaryFile; availability: FileAvailability }[],
  setLoadingNewDictionary: React.Dispatch<
    React.SetStateAction<
      YomichanDictionary | CEDictDictionary | DictCCDictionary | null
    >
  >
) {
  //TODO: optional chaining after prettier update
  const justFinishedLoadingDictionary =
    loadingNewDictionary &&
    (
      (dictionaryFiles.find(
        f => f.availability.id === loadingNewDictionary.id
      ) as any) || {}
    ).file.id === loadingNewDictionary.id &&
    ['FAILED_TO_LOAD', 'CURRENTLY_LOADED'].includes(
      (
        (dictionaryFiles.find(
          f => f.availability.id === loadingNewDictionary.id
        ) as any) || {}
      ).availability.status || ''
    )
  if (justFinishedLoadingDictionary) {
    setLoadingNewDictionary(null)
  }
}

function DictionaryFileItem({
  availability,
  file,
  onClickDelete,
}: {
  availability: FileAvailability
  file: DictionaryFile
  onClickDelete: (type: DictionaryFileType, id: string) => void
}) {
  const handleClickDelete = useCallback(
    () => onClickDelete(file.type, availability.id),
    [availability.id]
  )
  return (
    <div key={availability.id}>
      <h4>
        {displayDictionaryType(file.type)} - {file.name}
      </h4>
      <TextField
        label="File location"
        value={availability.filePath}
        style={{ width: 'calc(100% - 4em)' }}
      />
      <IconButton onClick={handleClickDelete}>
        <Delete />
      </IconButton>
    </div>
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
          <p>
            Download link:{' '}
            <a onClick={openInBrowser} href={DICT_CC_DOWNLOAD_URL}>
              {DICT_CC_DOWNLOAD_URL}
            </a>
          </p>
          <p>
            After providing an e-mail address, you'll receive instructions on
            how to proceed to downloading the.ZIP file.
            <strong>Remember what folder you download it into!</strong>
          </p>
          <p>
            Once you've received the ZIP file, you may push the button below to
            import it into Knowclip.
          </p>
          <p style={{ textAlign: 'center' }}>{button}</p>
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
          <p>
            Japanese-English download link:
            <br />
            <a onClick={openInBrowser} href={YOMICHAN_JMDICT_DOWNLOAD_URL}>
              {YOMICHAN_JMDICT_DOWNLOAD_URL}
            </a>
          </p>
          <p>
            Once the .ZIP file is finished downloading, press the IMPORT
            DICTIONARY button and point to the file in your download folder.
          </p>
          <p style={{ textAlign: 'center' }}>{button}</p>
          <p>
            For other languages than English, you may try using any of the{' '}
            <strong>JMDict</strong> files from the Yomichan site, but these
            haven't been tested with Knowclip.
          </p>
          <p>
            Japanese-Other download link:{' '}
            <a onClick={openInBrowser} href={YOMICHAN_SITE_URL}>
              {YOMICHAN_JMDICT_DOWNLOAD_URL}
            </a>
          </p>
        </>
      )
    case 'CEDictDictionary':
      return (
        <>
          <p>
            This Chinese-English dictionary data is a mirror of the data from
            the MDBG dictionary, used in popular apps like Pleco.
          </p>
          <p>
            Chinese-English download link:{' '}
            <a onClick={openInBrowser} href={CEDICT_DOWNLOAD_URL}>
              {CEDICT_DOWNLOAD_URL}
            </a>
          </p>
          <p>
            Once the .ZIP file is finished downloading, press the IMPORT
            DICTIONARY button and point to the file in your download folder.
          </p>
          <p style={{ textAlign: 'center' }}>{button}</p>
          <p>
            The MDBG data is updated frequently, and you can get the latest
            version of it here. Just be warned it may not have been tested with
            Knowclip.
          </p>
          <p>
            Latest Chinese-English download link:{' '}
            <a onClick={openInBrowser} href={CEDICT_SITE_URL}>
              {CEDICT_SITE_URL}
            </a>
          </p>
        </>
      )
  }
}
