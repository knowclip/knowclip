import 'rxjs' // eslint-disable-line no-unused-vars
import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import App from '../components/App'

import getStore from '../store'
import '../index.css'
import { initSentry } from 'preloaded/initSentry'
import ErrorMessage from '../components/ErrorMessage'
import { VITEST } from '../env'
import { sendToMainProcess } from 'preloaded/sendToMainProcess'

const sentryDsn = 'https://bbdc0ddd503c41eea9ad656b5481202c@sentry.io/1881735'
const RESIZE_OBSERVER_ERROR_MESSAGE = 'ResizeObserver loop limit exceeded'
initSentry({
  dsn: sentryDsn,
  ignoreErrors: [RESIZE_OBSERVER_ERROR_MESSAGE],
})

window.document.addEventListener('DOMContentLoaded', () => {
  window.electronApi.listenToTestIpcEvents()
})

window.addEventListener('error', (e) => {
  if (e && e.message && e.message.includes(RESIZE_OBSERVER_ERROR_MESSAGE))
    return
  const errorRoot = document.getElementById('errorRoot') as HTMLDivElement
  errorRoot.style.display = 'block'
  ReactDOM.render(<ErrorMessage reactError={e} />, errorRoot)
})

if (VITEST)
  sendToMainProcess({
    type: 'getPersistedTestState',
    args: [],
  }).then(({ result: initialTestState }) => {
    render(initialTestState)
  })
else render()

function render(initialTestState?: Partial<AppState> | undefined) {
  const { store } = getStore(initialTestState)

  ReactDOM.render(
    <React.StrictMode>
      <Provider store={store}>
        <App sentryDsn={sentryDsn} />
      </Provider>
    </React.StrictMode>,
    document.getElementById('root')
  )
}
