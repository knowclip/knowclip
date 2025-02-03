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

export const getOpenDictionaryFiles = (
  state: AppState
): { file: DictionaryFile; availability: FileAvailability }[] => {
  const files: { file: DictionaryFile; availability: FileAvailability }[] = []
  const dictFiles = {
    ...state.fileAvailabilities.Dictionary,
  }
  for (const id in dictFiles) {
    const availability = dictFiles[id]
    if (!availability) console.error('Problem opening dictionary files')
    else {
      const file = getFile(state, availability.type, availability.id)
      if (file)
        files.push({
          file: file as DictionaryFile,
          availability,
        })
    }
  }
  return files
}

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
