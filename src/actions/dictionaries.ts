import A from '../types/ActionType'
import { filesActions } from './files'

export const dictionariesActions = {
  importDictionaryRequest: (dictionaryType: DictionaryFileType) => ({
    type: A.importDictionaryRequest,
    dictionaryType,
  }),

  startDictionaryImport: (file: DictionaryFile, filePath: FilePath) => ({
    type: A.startDictionaryImport,
    file,
    filePath,
  }),

  deleteImportedDictionary: (file: DictionaryFile) => ({
    type: A.deleteImportedDictionary,
    file,
  }),

  resetDictionariesDatabase: () => ({
    type: A.resetDictionariesDatabase,
  }),
}

const finishDictionaryImport = (id: FileId) =>
  filesActions.updateFile({
    updateName: 'finishDictionaryImport',
    updatePayload: [],
    id,
    fileType: 'Dictionary',
  })

export const compositeDictionariesActions = {
  finishDictionaryImport,
}
