import r from '../redux'
import {
  DeleteFileRequestHandler,
  DeleteFileSuccessHandler,
  FileEventHandlers,
} from './eventHandlers'
import { DICTIONARIES_TABLE } from '../utils/dictionariesDatabase'
import { basename } from '../utils/rendererPathHelpers'
import { FileUpdateName } from './FileUpdateName'

export type LexiconEntry = {
  variant: string | null
  key: number
  dictionaryKey: number
  head: string
  meanings: string[]
  /** parts of speech etc. */
  tags: string | null
  pronunciation: string | null
  frequencyScore: number | null
  searchTokensCount: number
  tokenCombos: string[]
}

// TODO: test different entry shapes
// with navigator.storage.estimate()

export const getTableName = (type: DictionaryFileType) => `${type}`

const deleteRequest: DeleteFileRequestHandler<DictionaryFile> = async (
  file,
  availability,
  _descendants,
  _state,
  effects
) => {
  if (file) {
    const dictionaryExistsInDb = Boolean(
      await effects.getDexieDb().table(DICTIONARIES_TABLE).get(file.key)
    )
    const entriesExistInDb = Boolean(
      await effects
        .getDexieDb()
        .table(getTableName(file.dictionaryType))
        .where('dictionaryKey' as keyof LexiconEntry)
        .equals(file.key)
        .first()
    )

    if (dictionaryExistsInDb || entriesExistInDb)
      return [
        r.removeActiveDictionary(file.id),
        r.deleteImportedDictionary(file),
      ]
  }

  return [
    ...(file ? [r.removeActiveDictionary(file.id)] : []),
    r.deleteFileSuccess(availability, []),
  ]
}
const deleteSuccess: DeleteFileSuccessHandler = async (
  { file },
  _state,
  _effects
) => {
  return [r.commitFileDeletions(file.type)]
}

export const dictionaryActions: FileEventHandlers<DictionaryFile> = {
  openRequest: async (file, filePath, _state, effects) => {
    if (file.importComplete)
      return [r.openFileSuccess(file, filePath, effects.nowUtcTimestamp())]

    const { platform } = window.electronApi

    return [
      r.openFileFailure(file, filePath, null),
      r.promptSnackbar(
        `It appears the import process was interrupted for dictionary file "${basename(
          platform,
          filePath
        )}". Try removing it from Knowclip in the settings, or resetting the dictionaries database.`,
        [['Dictionary settings', r.dictionariesDialog()]]
      ),
    ]
  },
  openSuccess: [],

  locateRequest: async (_file, _availability, _message, _state, _effects) => {
    return []
  },

  locateSuccess: null,
  deleteRequest: [deleteRequest],
  deleteSuccess: [deleteSuccess],
}

export const updates = {
  [FileUpdateName.FinishDictionaryImport]: (file) => ({
    ...file,
    importComplete: true,
  }),
} satisfies FileUpdatesForFileType<DictionaryFile>
