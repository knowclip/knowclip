import { createSelector } from 'reselect'
import { getFile } from './files'

export const getActiveDictionaries = (state: AppState) => {
  return state.settings.activeDictionaries
}

export const getActiveDictionaryType = (
  state: AppState
): DictionaryFileType | null => {
  if (
    !state.settings.activeDictionaries ||
    !state.settings.activeDictionaries.length
  )
    return null
  else return state.settings.activeDictionaries[0].type
}

export const getRememberedDictionaryFiles = (state: AppState) => {
  return Object.values(state.fileAvailabilities.Dictionary) as KnownFile[]
}

export const getOpenDictionaryFiles = createSelector(
  (state: AppState) => state.fileAvailabilities.Dictionary,
  (state: AppState) => state.files,
  (dictFiles, files) => {
    const openFiles: {
      file: DictionaryFile
      availability: FileAvailability
    }[] = []
    for (const id in dictFiles) {
      const availability = dictFiles[id]
      if (!availability) console.error('Problem opening dictionary files')
      else {
        const file = files.Dictionary[availability.id]
        if (file)
          openFiles.push({
            file: file as DictionaryFile,
            availability,
          })
      }
    }
    return openFiles
  }
)

export const getActiveDictionaryFiles = createSelector(
  getActiveDictionaries,
  getOpenDictionaryFiles,
  (activeDictionaries, openDictionaryFiles) => {
    return openDictionaryFiles.filter((dictFile) =>
      activeDictionaries?.some(
        (activeDict) => activeDict.id === dictFile.file.id
      )
    )
  }
)
export const getActiveYomitanDictionaryFilesMap = createSelector(
  getActiveDictionaryFiles,
  (activeDictionaryFiles) => {
    const yomitanFiles = activeDictionaryFiles.filter(
      (dictFile) => dictFile.file.dictionaryType === 'YomitanDictionary'
    )
    return new Map(
      yomitanFiles.map((dictFile) => [
        dictFile.file.id,
        dictFile.file as YomitanDictionary,
      ])
    )
  }
)

export const displayDictionaryType = (
  dictionaryType: DictionaryFileType
): string => {
  switch (dictionaryType) {
    case 'DictCCDictionary':
      return 'German - Dict.cc'
    case 'YomichanDictionary':
      return 'Japanese - Yomichan JMDict'
    case 'CEDictDictionary':
      return 'Mandarin Chinese - MDBG CEDict'
    case 'YomitanDictionary':
      return 'Yomitan format (any language)'
  }
}

export const dictionaryTypes: DictionaryFileType[] = [
  'YomichanDictionary',
  'DictCCDictionary',
  'CEDictDictionary',
  'YomitanDictionary',
]
