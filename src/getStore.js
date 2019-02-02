import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import reducer from './reducers'
import epic from './epics'
import { getPersistedState } from './utils/statePersistence'

const composeEnhancers =
  process.env.NODE_ENV === 'development'
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : compose

export default function getStore() {
  const epicMiddleware = createEpicMiddleware()

  const store = createStore(
    reducer,
    getPersistedState(),
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
