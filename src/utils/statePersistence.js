// @flow
import fs from 'fs'
import { initialState as initialNoteTypeState } from '../reducers/noteTypes'
import { PROJECT_FILE_VERSION_MISMATCH_MESSAGE } from '../selectors/snackbar'
import parseProject from '../utils/parseProject'

// export const persistState = (state: AppState) => {
//   const { audio, noteTypes } = state
//   window.localStorage.setItem('audio', JSON.stringify(audio))
//   // window.localStorage.setItem('clips', JSON.stringify(clips))
//   window.localStorage.setItem('noteTypes', JSON.stringify(noteTypes))
// }

// export const getProjectFilePath = (filePath: MediaFilePath): string =>
//   `${filePath}.afca`
// export const findExistingProjectFilePath = (
//   filePath: MediaFilePath
// ): ?string => {
//   const jsonPath = getProjectFilePath(filePath)
//   return filePath && fs.existsSync(jsonPath) ? jsonPath : null
// }

export const getPersistedState = (): $Shape<AppState> => {
  const persistedState: $Shape<AppState> = {}
  try {
    const projects = JSON.parse(window.localStorage.getItem('projects'))
    if (projects) persistedState.projects = projects
  } catch (err) {
    console.error(err)
  }

  return persistedState
}
