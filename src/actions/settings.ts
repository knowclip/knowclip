import * as A from '../types/ActionType'

export const setMediaFolderLocation = (
  directoryPath: string
): SetMediaFolderLocation => ({
  type: A.SET_MEDIA_FOLDER_LOCATION,
  directoryPath,
})

export const addAssetsDirectories = (
  directoryPaths: string[]
): AddAssetsDirectories => ({ type: A.ADD_ASSETS_DIRECTORIES, directoryPaths })

export const removeAssetsDirectories = (
  directoryPaths: string[]
): RemoveAssetsDirectories => ({
  type: A.REMOVE_ASSETS_DIRECTORIES,
  directoryPaths,
})

export const setCheckForUpdatesAutomatically = (
  check: boolean
): SetCheckForUpdatesAutomatically => ({
  type: A.SET_CHECK_FOR_UPDATES_AUTOMATICALLY,
  check,
})

export const overrideSettings = (
  settings: Partial<SettingsState>
): OverrideSettings => ({
  type: A.OVERRIDE_SETTINGS,
  settings,
})

export const addActiveDictionary = (
  id: string,
  dictionaryType: DictionaryFileType
): AddActiveDictionary => ({
  type: A.ADD_ACTIVE_DICTIONARY,
  id,
  dictionaryType,
})

export const removeActiveDictionary = (id: string): RemoveActiveDictionary => ({
  type: A.REMOVE_ACTIVE_DICTIONARY,
  id,
})
