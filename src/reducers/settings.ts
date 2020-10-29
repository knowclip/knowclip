import { Reducer } from 'redux'
import A from '../types/ActionType'

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
    case A.setMediaFolderLocation:
      return {
        ...state,
        mediaFolderLocation: action.directoryPath,
      }

    case A.addAssetsDirectories:
      return {
        ...state,
        assetsDirectories: [
          ...new Set([...state.assetsDirectories, ...action.directoryPaths]),
        ],
      }

    case A.removeAssetsDirectories:
      return {
        ...state,
        assetsDirectories: state.assetsDirectories.filter(
          (path) => !action.directoryPaths.includes(path)
        ),
      }

    case A.setCheckForUpdatesAutomatically:
      return {
        ...state,
        checkForUpdatesAutomatically: action.check,
      }

    case A.overrideSettings:
      return {
        ...state,
        ...action.settings,
      }

    case A.setViewMode:
      return { ...state, viewMode: action.viewMode }

    case A.addActiveDictionary: {
      const activeDictionaries = new Set([
        ...(state.activeDictionaries || []).filter(
          (d) => d.type === action.dictionaryType
        ),
        { id: action.id, type: action.dictionaryType },
      ])
      return {
        ...state,
        activeDictionaries: [...activeDictionaries],
      }
    }

    case A.removeActiveDictionary:
      return {
        ...state,
        activeDictionaries: (state.activeDictionaries || []).filter(
          (d) => d.id !== action.id
        ),
      }

    default:
      return state
  }
}

export default settings
