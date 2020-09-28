// better to keep this lenient
// as strict changes will force
// migrations in redux-persist.

declare type SettingsState = {
  mediaFolderLocation: string | null
  assetsDirectories: string[]
  checkForUpdatesAutomatically: boolean
  viewMode: ViewMode
  activeDictionaries?: { id: FileId; type: DictionaryFileType }[]
  // TODO: save recent `ProjectFile`s here?
}

declare type ViewMode = 'HORIZONTAL' | 'VERTICAL'
