import A from '../types/ActionType'
import { filesActions } from './files'

export const dictionariesActions = {
  importDictionaryRequest: (dictionaryType: DictionaryFileType) => ({
    type: A.importDictionaryRequest as const,
    dictionaryType,
  }),

  startDictionaryImport: (file: DictionaryFile, filePath: FilePath) => ({
    type: A.startDictionaryImport as const,
    file,
    filePath,
  }),

  deleteImportedDictionary: (file: DictionaryFile) => ({
    type: A.deleteImportedDictionary as const,
    file,
  }),

  resetDictionariesDatabase: () => ({
    type: A.resetDictionariesDatabase as const,
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
