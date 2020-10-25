import * as r from '../redux'
import {
  DeleteFileRequestHandler,
  DeleteFileSuccessHandler,
  FileEventHandlers,
} from './eventHandlers'
import { DICTIONARIES_TABLE } from '../utils/dictionariesDatabase'
import { updaterGetter } from './updaterGetter'
import { basename } from 'path'

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
  descendants,
  state,
  effects
) => {
  if (file) {
    const dictionaryExistsInDb = Boolean(
      await effects
        .getDexieDb()
        .table(DICTIONARIES_TABLE)
        .get(file.key)
    )
    const entriesExistInDb = Boolean(
      await effects
        .getDexieDb()
        .table(getTableName(file.type))
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
  state,
  effects
) => {
  return [r.commitFileDeletions(file.type)]
}

export const dictionaryActions: FileEventHandlers<DictionaryFile> = {
  openRequest: async (file, filePath, state, effects) => {
    if (file.importComplete) return [r.openFileSuccess(file, filePath)]

    return [
      r.openFileFailure(file, filePath, null),
      r.promptSnackbar(
        `It appears the import process was interrupted for dictionary file "${basename(
          filePath
        )}". Try removing it from Knowclip in the settings, or resetting the dictionaries database.`,
        [['Dictionary settings', r.dictionariesDialog()]]
      ),
    ]
  },
  openSuccess: [],

  locateRequest: async (file, availability, message, state, effects) => {
    return []
  },

  locateSuccess: null,
  deleteRequest: [deleteRequest],
  deleteSuccess: [deleteSuccess],
}

const updater = updaterGetter<DictionaryFile>()

export const updates = {
  finishDictionaryImport: updater(file => ({
    ...file,
    importComplete: true,
  })),
}
