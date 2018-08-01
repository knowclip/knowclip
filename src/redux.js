import { createStore, applyMiddleware, compose } from 'redux'
import reducer from './reducers'
import epic from './epics'
import { createEpicMiddleware } from 'redux-observable';

const composeEnhancers = process.env.NODE_ENV === 'development'
  ?window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  : compose

export default function getStore() {
  const epicMiddleware = createEpicMiddleware()

  return Promise.resolve({
    epicMiddleware,
    store: createStore(
      reducer,
      composeEnhancers(applyMiddleware(epicMiddleware))
    ),
  })
}
