import React, { ReactChildren, ReactNode, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Button,
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
  const { dictionaryFiles } = useSelector((state: AppState) => ({
    dictionaryFiles: r.getOpenDictionaryFiles(state),
  }))
  const onClickDelete = useCallback(
    (type: DictionaryFileType, id: string) =>
      dispatch(r.deleteFileRequest(type, id)),
    []
  )

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
        dispatch(
          r.openFileRequest(
            {
              type: newDictionaryType,
              name: basename(filePath),
              id: uuid(),
            },
            filePath
          )
        )
      })
    },
    [newDictionaryType]
  )

  return (
    <Dialog open={open}>
      <DialogContent>
        <h3>Add/remove dictionaries</h3>
        {!dictionaryFiles.length && (
          <p>You haven't added any dictionaries yet.</p>
        )}
        {dictionaryFiles.map(({ file, availability }) => {
          return (
            <DictionaryFileItem {...{ availability, file, onClickDelete }} />
          )
        })}

        <Select
          displayEmpty
          onChange={event => {
            setNewDictionaryType(event.target.value as any)
          }}
          value={newDictionaryType}
        >
          <MenuItem value={''}>What kind of new dictionary to add?</MenuItem>
          {dictionaryTypes.map(type => {
            return (
              <MenuItem key={type} value={type}>
                {displayDictionaryType(type)}
              </MenuItem>
            )
          })}
        </Select>

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
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default DictionariesDialog
function DictionaryFileItem({
  availability,
  file,
  onClickDelete,
}: {
  availability: FileAvailability
  file: DictionaryFile
  onClickDelete: (type: DictionaryFileType, id: string) => DeleteFileRequest
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
