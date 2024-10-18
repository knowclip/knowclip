// better to keep this lenient
// as strict changes will force
// migrations in redux-persist.

declare type SettingsState = {
  mediaFolderLocation: string | null
  assetsDirectories: string[]
  checkForUpdatesAutomatically: boolean
  warnBeforeConvertingMedia: boolean
  viewMode: ViewMode
  activeDictionaries?: { id: FileId; type: DictionaryFileType }[]
}

declare type ViewMode = 'HORIZONTAL' | 'VERTICAL'
