import * as r from '../redux'
import {
  DeleteFileRequestHandler,
  DeleteFileSuccessHandler,
  FileEventHandlers,
} from './eventHandlers'
import { DICTIONARIES_TABLE } from '../utils/dictionariesDatabase'
import { updaterGetter } from './updaterGetter'

export type LexiconEntry = LexiconMainEntry | LexiconVariantEntry
export type LexiconMainEntry = {
  variant: false
  dictionaryKey: number
  head: string
  meanings: string[]
  /** parts of speech etc. */
  tags: string | null
  pronunciation: string | null
  frequencyScore: number | null
  // maybe should include both
  // exactMatchWords and stems?

  // maybe also stems sorted and joined
  //  and/or stems joined

  searchTokensCount: number

  // /** for filtering entries that resolve exactly to given tokens */
  // searchTokensSorted: string
  // /** for filtering entries that contain given tokens.
  //  *  slower than `searchTokensSorted` because it requires JS filtering step */
  // searchTokens: string[]

  // /** for filtering entries that resolve exactly to given stems */
  // searchStems: string[]
  // /** for filtering entries that contain given tokens.
  //  *  slower than `searchStems` because it requires JS filtering step */
  // searchStemsSorted: string

  tokenCombos: string[]
}

// TODO: test different entry shapes
// with navigator.storage.estimate()

export type LexiconVariantEntry =
  // for trad/simpl chinese
  {
    variant: true
    dictionaryKey: number
    head: string
    mainEntry: string
  }

export const getTableName = (type: DictionaryFileType) => `${type}`

const deleteRequest: DeleteFileRequestHandler<DictionaryFile> = async (
  file,
  availability,
  descendants,
  state,
  effects
) => {
  if (
    file &&
    (availability.status === 'CURRENTLY_LOADED' ||
      availability.status === 'PREVIOUSLY_LOADED')
  ) {
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
        // r.deleteFileSuccess(availability, []),

        // should be like:
        // r.beginDictionaryDeletion()
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

export const dictionaryWasNeverImported = (
  state: AppState,
  file: DictionaryFile
) => {
  const availability = r.getFileAvailability(state, file)
  return !['CURRENTLY_LOADED', 'PREVIOUSLY_LOADED'].includes(
    availability.status
  )
}

export const yomichanActions: FileEventHandlers<YomichanDictionary> = {
  openRequest: async ({ file }, filePath, state, effects) => {
    return [r.openFileSuccess(file, filePath)]
  },
  openSuccess: [],

  locateRequest: async ({ file }, availability, state, effects) => {
    return []
  },

  locateSuccess: null,
  deleteRequest: [deleteRequest],
  deleteSuccess: [deleteSuccess],
}

export const dictCcActions: FileEventHandlers<DictCCDictionary> = {
  ...((yomichanActions as unknown) as FileEventHandlers<DictCCDictionary>),
}

export const ceDictActions: FileEventHandlers<CEDictDictionary> = {
  ...((yomichanActions as unknown) as FileEventHandlers<CEDictDictionary>),
}

const updater = updaterGetter<DictionaryFile>()

export const updates = {
  finishDictionaryImport: updater(file => ({
    ...file,
    importComplete: true,
  })),
}
