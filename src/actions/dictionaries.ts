import * as A from '../types/ActionType'

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

export const deleteDictionaryDatabase = (): DeleteDictionaryDatabase => ({
  type: A.DELETE_DICTIONARY_DATABASE,
})
