import A from '../types/ActionType'
import { KnowclipActionCreatorsSubset } from '.'
import { filesActions } from './files'
import { FileUpdateName } from '../files/FileUpdateName'

export const dictionariesActions = {
  importDictionaryRequest: (dictionary: CreateDictionarySpecs) => ({
    type: A.importDictionaryRequest,
    dictionary,
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
} satisfies KnowclipActionCreatorsSubset

const finishDictionaryImport = (id: FileId) =>
  filesActions.updateFile({
    updateName: FileUpdateName.FinishDictionaryImport,
    updatePayload: [],
    id,
    fileType: 'Dictionary',
  })

export const compositeDictionariesActions = {
  finishDictionaryImport,
}
