import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import persistedUndoableReducer from './reducers'
import epic from './epics'
import { listenForPersistedDataLogMessage } from './utils/statePersistence'
import epicsDependencies from './epicsDependencies'
import { persistStore } from 'redux-persist'

const reduxDevtoolsExtension = ((window as unknown) as {
  __REDUX_DEVTOOLS_EXTENSION__: any
}).__REDUX_DEVTOOLS_EXTENSION__

function getStore(initialState: Partial<AppState> | undefined) {
  const epicMiddleware = createEpicMiddleware({
    dependencies: epicsDependencies,
  })

  const store = createStore(
    persistedUndoableReducer,
    initialState as any,
    compose(
      applyMiddleware(epicMiddleware),
      ...(process.env.NODE_ENV === 'development' && reduxDevtoolsExtension
        ? [
            reduxDevtoolsExtension({
              stateSanitizer: ({ previous, next, ...state }: any) => ({
                ...state,
                previous: `${previous.length} items`,
                next: `${next.length} items`,
              }),
            }),
          ]
        : [])
    )
  )

  listenForPersistedDataLogMessage(store.getState)

  const persistor = persistStore(store)

  epicMiddleware.run(epic as any)

  return { store, persistor }
}

export default getStore
