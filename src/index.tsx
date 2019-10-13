import 'rxjs' // eslint-disable-line no-unused-vars
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import App from './App'
import getStore from './getStore'
import './index.css'
import registerServiceWorker from './registerServiceWorker'
import { AppContainer, setConfig, cold } from 'react-hot-loader'

setConfig({
  onComponentCreate: (type, name) =>
    (String(type).indexOf('useState') > 0 ||
      String(type).indexOf('useEffect') > 0) &&
    cold(type),
})

const store = getStore()

registerServiceWorker()

const render = (Component: typeof React.Component.constructor) =>
  ReactDOM.render(
    <AppContainer>
      <Provider store={store}>
        <Component />
      </Provider>
    </AppContainer>,
    document.getElementById('root')
  )

render(App)

// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default
    render(NextApp)
  })
}
