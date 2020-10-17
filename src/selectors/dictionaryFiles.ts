import { getFile } from './files'

export const getActiveDictionaries = (state: AppState) => {
  return (state.settings.activeDictionaries || [])
    .map(({ id, type }) => getFile(state, type, id))
    .filter((file): file is DictionaryFile => Boolean(file))
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
  const dictFiles = {
    ...state.fileAvailabilities.YomichanDictionary,
    ...state.fileAvailabilities.CEDictDictionary,
    ...state.fileAvailabilities.DictCCDictionary,
  }
  return Object.values(dictFiles) as KnownFile[]
}

export const getOpenDictionaryFiles = (
  state: AppState
): { file: DictionaryFile; availability: FileAvailability }[] => {
  const files: { file: DictionaryFile; availability: FileAvailability }[] = []
  const dictFiles = {
    ...state.fileAvailabilities.YomichanDictionary,
    ...state.fileAvailabilities.CEDictDictionary,
    ...state.fileAvailabilities.DictCCDictionary,
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

export const displayDictionaryType = (dictionaryType: DictionaryFileType) => {
  switch (dictionaryType) {
    case 'DictCCDictionary':
      return 'German - Dict.cc'
    case 'YomichanDictionary':
      return 'Japanese - Yomichan JMDict'
    case 'CEDictDictionary':
      return 'Mandarin Chinese - MDBG CEDict'
  }
}

export const dictionaryTypes: DictionaryFileType[] = [
  'YomichanDictionary',
  'DictCCDictionary',
  'CEDictDictionary',
]
