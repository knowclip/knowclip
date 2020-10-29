import A from '../types/ActionType'
import { filesActions } from './files'

export const dictionariesActions = {
  [A.importDictionaryRequest]: (dictionaryType: DictionaryFileType) => ({
    type: A.importDictionaryRequest,
    dictionaryType,
  }),

  [A.startDictionaryImport]: (file: DictionaryFile, filePath: FilePath) => ({
    type: A.startDictionaryImport,
    file,
    filePath,
  }),

  [A.deleteImportedDictionary]: (file: DictionaryFile) => ({
    type: A.deleteImportedDictionary,
    file,
  }),

  [A.resetDictionariesDatabase]: () => ({
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
