import { combineReducers } from 'redux'

import waveform from './waveform'
import clips from './clips'
import session from './session'
import snackbar from './snackbar'
import dialog from './dialog'
import subtitles from './subtitles'
import settings from './settings'
import fileAvailabilities from './fileAvailabilities'
import files from './files'
import { PersistConfig, createTransform, persistReducer } from 'redux-persist'
import createElectronStorage from 'redux-persist-electron-storage'
import { resetFileAvailabilities } from '../utils/statePersistence'

const storage = createElectronStorage()
const filesPersistConfig: PersistConfig<
  FilesState,
  FilesState,
  FilesState,
  FilesState
> = {
  key: 'files',
  storage,
  whitelist: [
    'ProjectFile',
    'DictCCDictionary',
    'CEDictDictionary',
    'YomichanDictionary',
  ] as (keyof FilesState)[],
}

const transform = createTransform(
  (inbound: FileAvailabilitiesState) => inbound,
  (outbound: FileAvailabilitiesState) => resetFileAvailabilities(outbound),
  {
    whitelist: ['fileAvailabilities'],
  }
)

const rootConfig: PersistConfig<AppState> = {
  key: 'root',
  storage,
  transforms: [transform],
  whitelist: ['settings', 'fileAvailabilities'],
}

const root = combineReducers<AppState>({
  waveform,
  clips,
  session,
  snackbar,
  dialog,
  subtitles,
  settings,
  fileAvailabilities,
  files: (persistReducer(filesPersistConfig, files) as unknown) as typeof files,
})

export default persistReducer(rootConfig, root)
