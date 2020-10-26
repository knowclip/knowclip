import { Reducer } from 'redux'
import * as A from '../types/ActionType'

export const initialState: SettingsState = {
  mediaFolderLocation: null,
  assetsDirectories: [],
  checkForUpdatesAutomatically: true,
  viewMode: 'VERTICAL',
}

const settings: Reducer<SettingsState, Action> = (
  state = initialState,
  action
): SettingsState => {
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

    case A.SET_VIEW_MODE:
      return { ...state, viewMode: action.viewMode }

    case A.ADD_ACTIVE_DICTIONARY: {
      const activeDictionaries = new Set([
        ...(state.activeDictionaries || []).filter(
          d => d.type === action.dictionaryType
        ),
        { id: action.id, type: action.dictionaryType },
      ])
      return {
        ...state,
        activeDictionaries: [...activeDictionaries],
      }
    }

    case A.REMOVE_ACTIVE_DICTIONARY:
      return {
        ...state,
        activeDictionaries: (state.activeDictionaries || []).filter(
          d => d.id !== action.id
        ),
      }

    default:
      return state
  }
}

export default settings
