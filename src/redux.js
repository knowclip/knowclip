import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import reducer from './reducers'
import epic from './epics'

const composeEnhancers = process.env.NODE_ENV === 'development'
  ?window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  : compose


export default function getStore() {
  const epicMiddleware = createEpicMiddleware()

  const store = createStore(
    reducer,
    composeEnhancers(applyMiddleware(epicMiddleware))
  )

  epicMiddleware.run(epic)

  return Promise.resolve(store)
}
