import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import reducer from './reducers'
import epic from './epics'
import { getPersistedState } from './utils/statePersistence'
import { initialState as initialAudioState } from './reducers/audio'

const composeEnhancers =
  process.env.NODE_ENV === 'development'
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : compose

export default function getStore() {
  const epicMiddleware = createEpicMiddleware()

  const persistedState = getPersistedState()
  console.log('persisted state', persistedState)

  const { audio: persistedAudio } = persistedState
  const state = {
    ...persistedState,
    audio: {
      ...initialAudioState,
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
