import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import reducer from './reducers'
import epic from './epics'
import {
  resetFileAvailabilities,
  listenForPersistedDataLogMessage,
} from './utils/statePersistence'
import epicsDependencies from './epicsDependencies'
import { persistStore, persistReducer, createTransform } from 'redux-persist'
import createElectronStorage from 'redux-persist-electron-storage'
import electron from 'electron'
import { readFileSync } from 'fs-extra'

let initialState: Partial<AppState> | undefined
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_SPECTRON)
  initialState = electron.remote.process.env.PERSISTED_STATE_PATH
    ? JSON.parse(
        readFileSync(electron.remote.process.env.PERSISTED_STATE_PATH, 'utf8')
      )
    : undefined

const transform = createTransform(
  (inbound: FileAvailabilitiesState) => inbound,
  (outbound: FileAvailabilitiesState) => resetFileAvailabilities(outbound),
  {
    whitelist: ['fileAvailabilities'],
  }
)

const persistedReducer = persistReducer(
  {
    key: 'root',
    storage: createElectronStorage(),
    transforms: [transform],
    whitelist: ['fileAvailabilities', 'settings'],
  },
  reducer
)

const getDevToolsCompose = () => {
  const devToolsCompose = ((window as unknown) as {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: typeof compose
  }).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__

  return devToolsCompose || compose
}
const composeEnhancers =
  process.env.NODE_ENV === 'development' ? getDevToolsCompose() : compose

function getStore() {
  const epicMiddleware = createEpicMiddleware({
    dependencies: epicsDependencies,
  })

  const store = createStore(
    persistedReducer,
    initialState,
    composeEnhancers(applyMiddleware(epicMiddleware))
  )

  listenForPersistedDataLogMessage(store.getState)

  const persistor = persistStore(store)

  epicMiddleware.run(epic as any)

  return { store, persistor }
}

const { store, persistor } = getStore()

export default store

export { persistor }

// should this go before running epic middleware?
// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.accept('./reducers', () => {
    store.replaceReducer(reducer)
  })
}
