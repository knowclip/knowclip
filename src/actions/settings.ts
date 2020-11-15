import A from '../types/ActionType'

export const settingsActions = {
  setMediaFolderLocation: (directoryPath: string) => ({
    type: A.setMediaFolderLocation,
    directoryPath,
  }),

  addAssetsDirectories: (directoryPaths: string[]) => ({
    type: A.addAssetsDirectories,
    directoryPaths,
  }),

  removeAssetsDirectories: (directoryPaths: string[]) => ({
    type: A.removeAssetsDirectories,
    directoryPaths,
  }),

  setCheckForUpdatesAutomatically: (check: boolean) => ({
    type: A.setCheckForUpdatesAutomatically,
    check,
  }),

  overrideSettings: (settings: Partial<SettingsState>) => ({
    type: A.overrideSettings,
    settings,
  }),

  addActiveDictionary: (id: string, dictionaryType: DictionaryFileType) => ({
    type: A.addActiveDictionary,
    id,
    dictionaryType,
  }),

  removeActiveDictionary: (id: string) => ({
    type: A.removeActiveDictionary,
    id,
  }),
}
