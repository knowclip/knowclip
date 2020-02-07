export const getMediaFolderLocation = (state: AppState): string | null =>
  state.settings.mediaFolderLocation

export const getAssetsDirectories = (state: AppState): string[] =>
  state.settings.assetsDirectories
