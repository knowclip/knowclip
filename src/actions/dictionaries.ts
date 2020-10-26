import * as A from '../types/ActionType'
import { updateFile } from './files'

export const importDictionaryRequest = (
  dictionaryType: DictionaryFileType
): ImportDictionaryRequest => ({
  type: A.IMPORT_DICTIONARY_REQUEST,
  dictionaryType,
})

export const startDictionaryImport = (
  file: DictionaryFile,
  filePath: FilePath
): StartDictionaryImport => ({
  type: A.START_DICTIONARY_IMPORT,
  file,
  filePath,
})

export const finishDictionaryImport = (id: FileId): UpdateFile =>
  updateFile({
    updateName: 'finishDictionaryImport',
    updatePayload: [],
    id,
    fileType: 'Dictionary',
  })

export const deleteImportedDictionary = (
  file: DictionaryFile
): DeleteImportedDictionary => ({
  type: A.DELETE_IMPORTED_DICTIONARY,
  file,
})

export const resetDictionariesDatabase = (): ResetDictionariesDatabase => ({
  type: A.RESET_DICTIONARIES_DATABASE,
})
