import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import persistedReducer from './reducers'
import epic from './epics'
import { listenForPersistedDataLogMessage } from './utils/statePersistence'
import epicsDependencies from './epicsDependencies'
import { persistStore } from 'redux-persist'
import electron from 'electron'
import { readFileSync } from 'fs-extra'

const getDevToolsCompose = () => {
  const devToolsCompose = ((window as unknown) as {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: typeof compose
  }).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__

  return devToolsCompose || compose
}
const composeEnhancers =
  process.env.NODE_ENV === 'development' ? getDevToolsCompose() : compose

function getStore(initialState: Partial<AppState> | undefined) {
  const epicMiddleware = createEpicMiddleware({
    dependencies: epicsDependencies,
  })

  const store = createStore(
    persistedReducer,
    initialState as any,
    composeEnhancers(applyMiddleware(epicMiddleware))
  )

  listenForPersistedDataLogMessage(store.getState)

  const persistor = persistStore(store)

  epicMiddleware.run(epic as any)

  return { store, persistor }
}

export default getStore

