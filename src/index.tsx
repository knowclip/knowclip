import 'rxjs' // eslint-disable-line no-unused-vars
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import App from './components/App'

import getStore from './store'
import './index.css'
import * as Sentry from '@sentry/electron'
import ErrorMessage from './components/ErrorMessage'
import { sendToMainProcess } from './messages'

const sentryDsn = 'https://bbdc0ddd503c41eea9ad656b5481202c@sentry.io/1881735'
const RESIZE_OBSERVER_ERROR_MESSAGE = 'ResizeObserver loop limit exceeded'
Sentry.init({
  dsn: sentryDsn,
  ignoreErrors: [RESIZE_OBSERVER_ERROR_MESSAGE],
})

window.addEventListener('error', (e) => {
  if (e && e.message && e.message.includes(RESIZE_OBSERVER_ERROR_MESSAGE))
    return
  const errorRoot = document.getElementById('errorRoot') as HTMLDivElement
  errorRoot.style.display = 'block'
  ReactDOM.render(<ErrorMessage reactError={e} />, errorRoot)
})

sendToMainProcess({
  type: 'getPersistedTestState',
  args: [],
}).then(({ result: initialTestState }) => {
  if (initialTestState) console.log({ initialTestState })

  const { store } = getStore(initialTestState as Partial<AppState>)
  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <App sentryDsn={sentryDsn} />
      </Provider>
    </React.StrictMode>,
    document.getElementById('root')
  )
})

// on create new card with blank fields, focus transcription field

// define action types and action creators according to one way. maybe delete individual types and use only ActionOf.
