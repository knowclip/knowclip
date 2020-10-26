import 'rxjs' // eslint-disable-line no-unused-vars
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import App from './components/App'
import store from './store'
import './index.css'
import * as Sentry from '@sentry/electron'
import ErrorMessage from './components/ErrorMessage'

const sentryDsn = 'https://bbdc0ddd503c41eea9ad656b5481202c@sentry.io/1881735'
const RESIZE_OBSERVER_ERROR_MESSAGE = 'ResizeObserver loop limit exceeded'
Sentry.init({
  dsn: sentryDsn,
  ignoreErrors: [RESIZE_OBSERVER_ERROR_MESSAGE],
})

window.addEventListener('error', e => {
  if (e && e.message && e.message.includes(RESIZE_OBSERVER_ERROR_MESSAGE))
    return
  const errorRoot = document.getElementById('errorRoot') as HTMLDivElement
  errorRoot.style.display = 'block'
  ReactDOM.render(<ErrorMessage reactError={e} />, errorRoot)
})

const render = (Component: typeof App.constructor) =>
  ReactDOM.render(
    <Provider store={store}>
      <Component sentryDsn={sentryDsn} />
    </Provider>,
    document.getElementById('root')
  )

render(App)
