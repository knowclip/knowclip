import { RemoteOptions, remote } from 'webdriverio'
import Chromedriver from './Chromedriver'
import request from 'request'
import { ChildProcess } from 'child_process'
import type {
  MessageResponse,
  MessageToMainType,
  MessageToMain,
  MessageHandlerResult,
} from '../../MessageToMain'

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
  env,
  logLevel = 'error',
}: {
  chromedriverPath: string
  webdriverIoPath: string
  appDir: string
  chromeArgs: string[]
  env?: NodeJS.ProcessEnv
  logLevel?: WebDriverLogTypes
}) {
  const hostname = 'localhost'
  const port = 9515
  const urlBase = '/'

  const statusUrl = `http://${hostname}:${port}${urlBase}status`
  const driver = new Chromedriver(chromedriverPath, statusUrl, {
    env,
  })
  await waitForChromeDriver(driver.process, statusUrl, 7000)

  const browserOptions: RemoteOptions = {
    waitforTimeout: 5000,
    hostname,
    port,
    capabilities: {
      browserName: 'chrome',
      'goog:chromeOptions': {
        binary: webdriverIoPath,
        args: [...chromeArgs, 'app=' + appDir],
        windowTypes: ['app', 'webview'],
      },
    },
    logLevel,
  }
  const browser: WebdriverIO.Browser = await remote(browserOptions)
  return new TestDriver({
    browser,
    driver,
  })
}

export class TestDriver {
  startupStatus: Promise<MessageResponse<'ok'>>
  client: WebdriverIO.Browser
  _driver: Chromedriver

  constructor({
    driver,
    browser,
  }: {
    driver: Chromedriver
    browser: WebdriverIO.Browser
  }) {
    this.client = browser
    this._driver = driver

    this.startupStatus = this.sendToMainProcess({
      type: 'isReady',
      args: [],
    }).catch(async (rawError): Promise<MessageResponse<'ok'>> => {
      console.error('Application failed to start', rawError)
      console.log(rawError)
      this.stop()

      const error = {
        message:
          rawError instanceof Error ? rawError.message : String(rawError),
        stack: rawError instanceof Error ? rawError.stack : undefined,
        name: rawError instanceof Error ? rawError.name : undefined,
      }
      return Promise.resolve({ error })
    })
  }

  sendToMainProcess<T extends MessageToMainType>(
    message: MessageToMain<T>
  ): Promise<MessageResponse<MessageHandlerResult<T>>> {
    return this.client.executeAsync((message: MessageToMain<T>, done) => {
      return (
        window.electronApi
          ?.invokeMessage(message)
          .then((result) => {
            done(result)
            return result
          })
          .catch((error) => {
            console.error('error invoking message', error)
            done({ error })
            return { error }
          }) || done({ error: { message: 'no electronApi found on window' } })
      )
    }, message)
  }

  /** send message to renderer */
  async webContentsSend(channel: string, ...args: any[]) {
    try {
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
    await this.client.deleteSession()

    const isRunningNow = () =>
      new Promise((res, _rej) => {
        try {
          isRunning(this._driver.statusUrl, (running: any) => {
            if (running) res(true)
            else res(false)
          })
        } catch (err) {
          console.error(err)
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
      return window.electronApi.close()
    })
  }
}
