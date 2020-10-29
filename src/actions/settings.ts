import A from '../types/ActionType'

export const settingsActions = {
  [A.setMediaFolderLocation]: (directoryPath: string) => ({
    type: A.setMediaFolderLocation,
    directoryPath,
  }),

  [A.addAssetsDirectories]: (directoryPaths: string[]) => ({
    type: A.addAssetsDirectories,
    directoryPaths,
  }),

  [A.removeAssetsDirectories]: (directoryPaths: string[]) => ({
    type: A.removeAssetsDirectories,
    directoryPaths,
  }),

  [A.setCheckForUpdatesAutomatically]: (check: boolean) => ({
    type: A.setCheckForUpdatesAutomatically,
    check,
  }),

  [A.overrideSettings]: (settings: Partial<SettingsState>) => ({
    type: A.overrideSettings,
    settings,
  }),

  [A.addActiveDictionary]: (
    id: string,
    dictionaryType: DictionaryFileType
  ) => ({
    type: A.addActiveDictionary,
    id,
    dictionaryType,
  }),

  [A.removeActiveDictionary]: (id: string) => ({
    type: A.removeActiveDictionary,
    id,
  }),
}
