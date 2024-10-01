import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import { getPersistedUndoableReducer, getUndoableReducer } from './reducers'
import epic from './epics'
import epicsDependencies from './epicsDependencies'
import { persistStore } from 'redux-persist'

const reduxDevtoolsExtension = (
  window as unknown as {
    __REDUX_DEVTOOLS_EXTENSION__: any
  }
).__REDUX_DEVTOOLS_EXTENSION__

function getStore(
  initialTestState: Partial<AppState> | undefined,
  electronStorage: ElectronStorage
) {
  const { NODE_ENV, VITE_INTEGRATION_DEV, VITEST } = window.electronApi.env

  const epicMiddleware = createEpicMiddleware({
    dependencies: epicsDependencies,
  })
  const undoableReducer = getUndoableReducer(electronStorage)
  const persistedUndoableReducer = getPersistedUndoableReducer(electronStorage)

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

export interface ElectronStorage<T = {}> {
  getItem<K extends keyof T>(key: K): Promise<T[K]>
  getItem(key: string): Promise<any>

  setItem<K extends keyof T>(key: K, item: T[K]): Promise<void>
  setItem(key: string, item: any): Promise<void>

  removeItem<K extends keyof T>(key: K): Promise<void>
  removeItem(key: string): Promise<void>
}
