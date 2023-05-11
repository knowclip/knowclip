import { Browser, remote } from 'webdriverio'
import Chromedriver from './Chromedriver'
import request from 'request'
import { ChildProcess } from 'child_process'
import type {
  MessageResponse,
  MessageToMainType,
  MessageToMain,
  MessageHandlerResult,
} from '../../getMessageResponders'

type WebDriverLogTypes =
  | 'trace'
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'silent'

function isRunning(statusUrl: string, callback: Function) {
  const cb = false
  const requestOptions = {
    uri: statusUrl,
    json: true,
    followAllRedirects: true,
  }
  request(requestOptions, function (error, response, body) {
    if (error) return callback(cb)
    if (response.statusCode !== 200) return callback(cb)
    callback(body && body.value.ready)
  })
}

function waitForChromeDriver(
  driverProcess: ChildProcess,
  statusUrl: string,
  startTimeout: number
) {
  return new Promise<boolean>(function (resolve, reject) {
    const startTime = Date.now()
    const checkIfRunning = function () {
      isRunning(statusUrl, (running: any) => {
        if (!driverProcess) {
          return reject(Error('ChromeDriver has been stopped'))
        }

        if (running) {
          return resolve(true)
        }

        const elapsedTime = Date.now() - startTime
        if (elapsedTime > startTimeout) {
          return reject(
            Error('ChromeDriver did not start within ' + startTimeout + 'ms')
          )
        }

        global.setTimeout(checkIfRunning, 100)
      })
    }
    checkIfRunning()
  })
}
export function waitForChromeDriverToStop(
  driverProcess: ChildProcess,
  statusUrl: string,
  stopTimeout: number
) {
  return new Promise<boolean>(function (resolve, reject) {
    const startTime = Date.now()
    const checkIfRunning = function () {
      isRunning(statusUrl, (running: any) => {
        if (!driverProcess) {
          return resolve(true)
        }

        const elapsedTime = Date.now() - startTime
        if (running && elapsedTime > stopTimeout) {
          return reject(
            Error('ChromeDriver did not start within ' + stopTimeout + 'ms')
          )
        } else {
          global.setTimeout(checkIfRunning, 100)
        }
      })
    }
    checkIfRunning()
  })
}

export async function createTestDriver({
  chromedriverPath,
  webdriverIoPath,
  appDir,
  chromeArgs,
  env: givenEnv,
  logLevel = 'error',
}: {
  chromedriverPath: string
  webdriverIoPath: string
  appDir: string
  chromeArgs: string[]
  env?: NodeJS.ProcessEnv
  logLevel?: WebDriverLogTypes
}) {
  const hostname = '127.0.0.1'
  const port = 9515
  const urlBase = '/'

  const env = {
    NODE_ENV: 'test',
    REACT_APP_TEST_DRIVER: 'true',
    ELECTRON_START_URL: 'http://localhost:3000',
    ...givenEnv,
  } as NodeJS.ProcessEnv

  const driver = new Chromedriver(chromedriverPath, [], { env })
  await waitForChromeDriver(
    driver.process,
    `http://${hostname}:${port}${urlBase}status`,
    7000
  )

  const browser: Browser = await remote({
    waitforTimeout: 30000,
    hostname,
    port, // "9515" is the port opened by chrome driver.
    capabilities: {
      browserName: 'chrome',
      'goog:chromeOptions': {
        binary: webdriverIoPath,
        args: [...chromeArgs, 'app=' + appDir],
        windowTypes: ['app', 'webview'],
      },
    },
    logLevel,
  })

  return new TestDriver({
    browser,
    driver,
  })
}

export class TestDriver {
  isReady: Promise<MessageResponse<boolean>>
  client: Browser
  _driver: Chromedriver

  constructor({ driver, browser }: { driver: Chromedriver; browser: Browser }) {
    this.client = browser
    this._driver = driver

    this.isReady = this.sendToMainProcess({ type: 'isReady', args: [] }).catch(
      (err) => {
        console.error('Application failed to start', err)
        this.stop()
        process.exit(1)
      }
    )
  }

  async sendToMainProcess<T extends MessageToMainType>(
    message: MessageToMain<T>
  ): Promise<MessageResponse<MessageHandlerResult<T>>> {
    // @ts-ignore
    return this.client.executeAsync((message: MessageToMain<T>, done) => {
      const { ipcRenderer } = require('electron')
      ipcRenderer.invoke('message', message).then(async (result) => {
        done(await result)
      })
    }, message)
  }

  /** send message to renderer */
  async webContentsSend(channel: string, ...args: any[]) {
    try {
      // roundabout, but probably the only way to do it
      // without using electron.remote
      const result = await this.sendToMainProcess({
        type: 'sendToRenderer',
        args: [channel, args],
      })
      return result
    } catch (err) {
      console.error(
        `Problem sending "${channel}" with args: ${args.join(', ')}`
      )
      console.error(err)
      return
    }
  }

  async stop() {
    await this.client.closeWindow()
    // await browser.deleteSession();

    const isRunningNow = () =>
      new Promise((res, _rej) => {
        try {
          isRunning('http://localhost:9515/status', (running: any) => {
            if (running) res(true)
            else res(false)
          })
        } catch (err) {
          return res(false)
        }
      })

    if (await isRunningNow()) {
      const killed = this._stopChromeDriver()
      if (!killed) throw new Error('Could not kill chromedriver process')
    }
  }

  _stopChromeDriver() {
    return this._driver.stop()
  }

  async closeWindow() {
    await this.client.execute(() => {
      return require('electron').ipcRenderer.invoke('close')
    })
  }
}
