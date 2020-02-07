import { Reducer } from 'redux'

export const initialState: SettingsState = {
  mediaFolderLocation: null,
  assetsDirectories: [],
  checkForUpdatesAutomatically: true,
}

const settings: Reducer<SettingsState, Action> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case A.SET_MEDIA_FOLDER_LOCATION:
      return {
        ...state,
        mediaFolderLocation: action.directoryPath,
      }

    case A.ADD_ASSETS_DIRECTORIES:
      return {
        ...state,
        assetsDirectories: [
          ...new Set([...state.assetsDirectories, ...action.directoryPaths]),
        ],
      }

    case A.REMOVE_ASSETS_DIRECTORIES:
      return {
        ...state,
        assetsDirectories: state.assetsDirectories.filter(
          path => !action.directoryPaths.includes(path)
        ),
      }

    case A.SET_CHECK_FOR_UPDATES_AUTOMATICALLY:
      return {
        ...state,
        checkForUpdatesAutomatically: action.check,
      }

    case A.OVERRIDE_SETTINGS:
      return {
        ...state,
        ...action.settings,
      }

    default:
      return state
  }
}

export default settings
