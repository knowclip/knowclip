import * as r from '../redux'
import {
  DeleteFileRequestHandler,
  DeleteFileSuccessHandler,
  FileEventHandlers,
} from './eventHandlers'
import { deleteDictionary } from '../utils/dictionariesDatabase'

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

  /** for filtering entries that resolve exactly to given tokens */
  searchTokensSorted: string
  /** for filtering entries that contain given tokens.
   *  slower than `searchTokensSorted` because it requires JS filtering step */
  searchTokens: string[]

  /** for filtering entries that resolve exactly to given stems */
  searchStems: string[]
  /** for filtering entries that contain given tokens.
   *  slower than `searchStems` because it requires JS filtering step */
  searchStemsSorted: string
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
  if (file) {
    try {
      if (
        availability.status === 'CURRENTLY_LOADED' ||
        availability.status === 'PREVIOUSLY_LOADED'
      )
        await deleteDictionary(
          effects.dexie,
          r.getOpenDictionaryFiles(state).map(d => d.file),
          file.key,
          file.type
        )

      return [
        r.removeActiveDictionary(file.id),
        r.deleteFileSuccess(availability, []),
      ]
    } catch (err) {
      return [
        r.errorDialog(
          `There was a problem deleting this dictionary file: ${err}`,
          String(err)
        ),
      ]
    }
  }

  return [r.deleteFileSuccess(availability, [])]
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
