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
