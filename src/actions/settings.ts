import A from '../types/ActionType'

export const settingsActions = {
  setMediaFolderLocation: (directoryPath: string) => ({
    type: A.setMediaFolderLocation as const,
    directoryPath,
  }),

  addAssetsDirectories: (directoryPaths: string[]) => ({
    type: A.addAssetsDirectories as const,
    directoryPaths,
  }),

  removeAssetsDirectories: (directoryPaths: string[]) => ({
    type: A.removeAssetsDirectories as const,
    directoryPaths,
  }),

  setCheckForUpdatesAutomatically: (check: boolean) => ({
    type: A.setCheckForUpdatesAutomatically as const,
    check,
  }),

  overrideSettings: (settings: Partial<SettingsState>) => ({
    type: A.overrideSettings as const,
    settings,
  }),

  addActiveDictionary: (id: string, dictionaryType: DictionaryFileType) => ({
    type: A.addActiveDictionary as const,
    id,
    dictionaryType,
  }),

  removeActiveDictionary: (id: string) => ({
    type: A.removeActiveDictionary as const,
    id,
  }),
}
