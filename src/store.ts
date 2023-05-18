import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import { persistedUndoableReducer, undoableReducer } from './reducers'
import epic from './epics'
import epicsDependencies from './epicsDependencies'
import { persistStore } from 'redux-persist'
import { NODE_ENV, VITE_INTEGRATION_DEV, VITEST } from './env'

const reduxDevtoolsExtension = (
  window as unknown as {
    __REDUX_DEVTOOLS_EXTENSION__: any
  }
).__REDUX_DEVTOOLS_EXTENSION__

function getStore(initialTestState: Partial<AppState> | undefined) {
  const epicMiddleware = createEpicMiddleware({
    dependencies: epicsDependencies,
  })

  const store = createStore(
    VITEST
      ? (undoableReducer as typeof persistedUndoableReducer)
      : persistedUndoableReducer,
    initialTestState as any,
    compose(
      applyMiddleware(epicMiddleware),
      ...((VITE_INTEGRATION_DEV || NODE_ENV === 'development') &&
      reduxDevtoolsExtension
        ? [
            reduxDevtoolsExtension({
              stateSanitizer: ({ previous, next, ...state }: any) => ({
                ...state,
                previous: `${previous?.length} items`,
                next: `${next?.length} items`,
              }),
            }),
          ]
        : [])
    )
  )

  const persistor = VITEST ? null : persistStore(store)

  epicMiddleware.run(epic as any)

  window.electronApi.listenToLogPersistedDataEvents(store.getState)

  return { store, persistor }
}

export default getStore
