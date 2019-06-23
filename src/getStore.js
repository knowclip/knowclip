import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import reducer from './reducers'
import epic from './epics'
import { getPersistedState } from './utils/statePersistence'
import { initialState as initialMediaState } from './reducers/audio'

const composeEnhancers =
  process.env.NODE_ENV === 'development'
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : compose

const elementWidth = element => {
  const boundingClientRect = element.getBoundingClientRect()
  return boundingClientRect.right - boundingClientRect.left
}

export default function getStore() {
  const epicMiddleware = createEpicMiddleware({
    dependencies: {
      document,
      window,
      setLocalStorage: (key, value) => window.localStorage.setItem(key, value),
      getWaveformSvgElement: () => document.getElementById('waveform-svg'),
      getWaveformSvgWidth: () =>
        elementWidth(document.getElementById('waveform-svg')),
      setCurrentTime: time =>
        (document.getElementById('audioPlayer').currentTime = time),
      getCurrentTime: () => document.getElementById('audioPlayer').currentTime,
      pauseMedia: () => document.getElementById('audioPlayer').pause(),
      toggleMediaPaused: () => {
        const el = document.getElementById('audioPlayer')
        if (el.paused) el.play()
        else el.pause()
      },
    },
  })

  const persistedState = getPersistedState()
  console.log('persisted state', persistedState)

  const { audio: persistedAudio } = persistedState
  const state = {
    ...persistedState,
    audio: {
      ...initialMediaState,
      ...(persistedAudio
        ? {
            mediaFolderLocation: persistedAudio.mediaFolderLocation,
          }
        : null),
    },
  }

  const store = createStore(
    reducer,
    state,
    composeEnhancers(applyMiddleware(epicMiddleware))
  )

  epicMiddleware.run(epic)

  // should this go before running epic middleware?
  if (module.hot) {
    module.hot.accept('./reducers', () => {
      store.replaceReducer(reducer)
    })
  }

  return store
}
