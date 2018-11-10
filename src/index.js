import 'rxjs' // eslint-disable-line no-unused-vars
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import App from './App'
import getStore from './redux'
// import epic from './epics'
import './index.css'
import registerServiceWorker from './registerServiceWorker'
import { AppContainer } from 'react-hot-loader'

const store = getStore()

registerServiceWorker()

const render = Component =>
  ReactDOM.render(
    <AppContainer>
      <Provider store={store}>
        <Component />
      </Provider>
    </AppContainer>,
    document.getElementById('root')
  )

render(App)

if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default
    render(NextApp)
  })
}
