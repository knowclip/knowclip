import { legacy_createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import { getPersistedUndoableReducer, getUndoableReducer } from './reducers'
import epic from './epics'
import epicsDependencies from './epicsDependencies'
import { PersistConfig, persistStore } from 'redux-persist'

const reduxDevtoolsExtension = (
  window as unknown as {
    __REDUX_DEVTOOLS_EXTENSION__: any
  }
).__REDUX_DEVTOOLS_EXTENSION__

function getStore(
  initialTestState: Partial<AppState> | undefined,
  electronStorage?: PersistConfig<AppState>['storage']
) {
  const { NODE_ENV, VITE_INTEGRATION_DEV, VITEST } = window.electronApi.env
  const meta = {
    platform: window.electronApi.platform,
    localServerAddress: window.electronApi.knowclipServerAddress,
  }

  const epicMiddleware = createEpicMiddleware({
    dependencies: epicsDependencies,
  })

  const store = legacy_createStore(
    VITEST || !electronStorage
      ? (getUndoableReducer(meta) as ReturnType<
          typeof getPersistedUndoableReducer
        >)
      : getPersistedUndoableReducer(meta, electronStorage),
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
