import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import reducer from './reducers'
import epic from './epics'
import { getPersistedState } from './utils/statePersistence'
import { initialState as initialSettingsState } from './reducers/settings'
import epicsDependencies from './epicsDependencies'

const composeEnhancers =
  process.env.NODE_ENV === 'development'
    ? ((window as unknown) as {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: typeof compose
      }).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : compose

export default function getStore() {
  const epicMiddleware = createEpicMiddleware({
    dependencies: epicsDependencies,
  })

  const persistedState = getPersistedState()
  console.log('persisted state', persistedState)

  const { settings: persistedSettings } = persistedState
  const state: Partial<AppState> = {
    ...persistedState,
    settings: {
      ...initialSettingsState,
      ...persistedSettings,
    },
  }

  const store = createStore(
    reducer,
    state,
    composeEnhancers(applyMiddleware(epicMiddleware))
  )

  epicMiddleware.run(epic as any)

  // should this go before running epic middleware?
  // @ts-ignore
  if (module.hot) {
    // @ts-ignore
    module.hot.accept('./reducers', () => {
      store.replaceReducer(reducer)
    })
  }

  return store
}
