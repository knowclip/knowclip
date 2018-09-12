import { createStore, applyMiddleware, compose } from 'redux'
import { createEpicMiddleware } from 'redux-observable'
import reducer from './reducers'
import epic from './epics'
export * from './selectors'
export * from './actions'

const inElectron = window.process && window.process.type
const composeEnhancers = process.env.NODE_ENV === 'development' && !inElectron
  ?window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  : compose


export default function getStore() {
  const epicMiddleware = createEpicMiddleware()

  const store = createStore(
    reducer,
    composeEnhancers(applyMiddleware(epicMiddleware))
    // composeEnhancers(applyMiddleware())
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
