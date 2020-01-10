import { Reducer } from 'redux'

export const initialState: SettingsState = {
  mediaFolderLocation: null,
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

    default:
      return state
  }
}

export default settings
