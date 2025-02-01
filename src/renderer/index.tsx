import 'rxjs' // eslint-disable-line no-unused-vars
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { Conf } from 'electron-conf/renderer'
import App from '../components/App'
import getStore from '../store'
import '../index.css'
import * as Sentry from '@sentry/electron/renderer'
import { init as reactInit } from '@sentry/react'
import ErrorMessage from '../components/ErrorMessage'
import { PersistGate } from 'redux-persist/integration/react'
import { IpcRendererEvent } from '../preload/IpcRendererEvent'

window.electronApi.listenToIpcRendererMessages(
  (electronIpcRendererEvent, message, payload) => {
    const event = new IpcRendererEvent(
      electronIpcRendererEvent,
      message,
      payload
    )
    window.dispatchEvent(event)
  }
)

const sentryDsn = 'https://bbdc0ddd503c41eea9ad656b5481202c@sentry.io/1881735'
const RESIZE_OBSERVER_ERROR_MESSAGE = 'ResizeObserver loop limit exceeded'
Sentry.init(
  {
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    ignoreErrors: [RESIZE_OBSERVER_ERROR_MESSAGE],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  },
  reactInit
)

window.document.addEventListener('DOMContentLoaded', () => {
  window.electronApi.listenToTestIpcEvents(
    (moduleId, functionName, newReturnValue, deserializedReturnValue) => {
      const { returnValues } = window.mockedModules[moduleId]

      returnValues[functionName].push(deserializedReturnValue)
      if (window.electronApi.env.VITE_INTEGRATION_DEV)
        window.electronApi.sendToMainProcess({
          type: 'log',
          args: [
            `\n\n\nFunction ${functionName} mocked with: ${JSON.stringify(
              newReturnValue
            )}\n\n\n`,
          ],
        })
    }
  )
})

window.addEventListener('error', (e) => {
  if (e && e.message && e.message.includes(RESIZE_OBSERVER_ERROR_MESSAGE))
    return
  const errorRoot = document.getElementById('errorRoot') as HTMLDivElement
  errorRoot.style.display = 'block'
  const root = createRoot(errorRoot)
  root.render(<ErrorMessage reactError={e.error} />)
})

render()

async function render() {
  const initialTestStateResult = window.electronApi.env.VITEST
    ? await window.electronApi.sendToMainProcess({
        type: 'getPersistedTestState',
        args: [],
      })
    : undefined

  if (initialTestStateResult?.error) {
    console.error(initialTestStateResult.error)
    throw new Error('Problem getting persisted test state.')
  } else console.log('initial test state', initialTestStateResult?.value)

  const conf = window.electronApi.env.VITEST ? undefined : new Conf()
  const { store, persistor } = getStore(
    initialTestStateResult?.value,
    conf
      ? {
          getItem: async (key: string) => conf.get(key),
          setItem: async (key: string, item: any) => conf.set(key, item),
          removeItem: async (key: string) => conf.delete(key),
        }
      : undefined
  )
  const root = createRoot(document.getElementById('root')!)

  root.render(
    <React.StrictMode>
      <Provider store={store}>
        {persistor ? (
          <PersistGate loading={null} persistor={persistor}>
            <App sentryDsn={sentryDsn} />
          </PersistGate>
        ) : (
          <App sentryDsn={sentryDsn} />
        )}
      </Provider>
    </React.StrictMode>
  )
}
