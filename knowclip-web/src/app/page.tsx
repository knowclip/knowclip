'use client'
import { VideoPlayer } from '@/VideoPlayer'
import Image from 'next/image'
import { combineReducers, compose, legacy_createStore } from 'redux'
import {
  PersistConfig,
  PersistedState,
  persistReducer,
  persistStore,
} from 'redux-persist'

type WebState = {
  files: Pick<
    FilesState,
    | 'ProjectFile'
    | 'MediaFile'
    | 'ExternalSubtitlesFile'
    | 'VideoStillImage'
    | 'VttConvertedSubtitlesFile'
    | 'WaveformPng'
  >
}

function getStore(electronStorage: PersistConfig<WebState>['storage']) {
  const reduxDevtoolsExtension = (
    window as unknown as {
      __REDUX_DEVTOOLS_EXTENSION__: any
    }
  ).__REDUX_DEVTOOLS_EXTENSION__

  const persistConfig: PersistConfig<WebState, WebState, WebState, WebState> = {
    key: 'root',
    version: 0,
    storage: electronStorage,
    whitelist: ['files'], // only files will be persisted
  }

  const reducer = (
    state: WebState | undefined = {
      files: {
        ProjectFile: {},
        MediaFile: {},
        ExternalSubtitlesFile: {},
        VideoStillImage: {},
        VttConvertedSubtitlesFile: {},
        WaveformPng: {},
      },
    },
    action: { type: string }
  ) => {
    switch (action.type) {
      default:
        return state
    }
  }
  const persistedReducer = persistReducer(persistConfig, reducer)
  const store = legacy_createStore(
    persistedReducer,
    undefined,
    reduxDevtoolsExtension ? compose(reduxDevtoolsExtension()) : undefined
  )

  const persistor = persistStore(store)

  return { store, persistor }
}

export default function Home() {
  return (
    <div className="font-sans  items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <VideoPlayer></VideoPlayer>
    </div>
  )
}
