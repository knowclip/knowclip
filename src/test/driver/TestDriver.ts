import { remote } from 'webdriverio'
import Chromedriver from './Chromedriver'
import request from 'request'
import { ChildProcess } from 'child_process'
import type {
  MessageResponse,
  MessageToMainType,
  MessageToMain,
  MessageHandlerResult,
} from '../../MessageToMain'
import { failure } from '../../utils/result'

type WebDriverLogTypes =
  | 'trace'
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'silent'

function isRunning(
  statusUrl: string,
  callback: (running: boolean) => void,
  verbose = false
) {
  request(
    {
      uri: statusUrl,
      json: true,
      followAllRedirects: true,
    },
    function (error, response, body) {
      if (verbose && error) {
        console.log(statusUrl, 'chromedriver status check ----- error', error)
        return callback(false)
      }
      if (verbose && response.statusCode !== 200) {
        console.log(
          statusUrl,
          'chromedriver status check ----- response.statusCode !== 200',
          response.statusCode
        )
        return callback(false)
      }
      if (verbose)
        console.log(
          statusUrl,
          'chromedriver status check ----- body',
          body?.value?.ready,
          body
        )
      callback(body && body.value.ready)
    }
  )
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
  const hostname = '127.0.0.1'
  const port = 9515
  const urlBase = '/'

  const statusUrl = `http://${hostname}:${port}${urlBase}status`
  const driver = new Chromedriver(chromedriverPath, {
    statusUrl: statusUrl,
    env,
    args: ['--port=' + port],
  })
  console.log(
    `Chromedriver to start via PID ${driver.process.pid} ${statusUrl}`
  )
  await waitForChromeDriver(driver.process, statusUrl, 7000)

  const browserOptions: WebdriverIO.RemoteConfig = {
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
      'wdio:enforceWebDriverClassic': true,
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
  startupStatus: AsyncResult<MessageResponse<'ok'>>
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
    }).catch(async (rawError): AsyncResult<MessageResponse<'ok'>> => {
      console.error('Application failed to start', rawError)
      this.stop()

      return Promise.resolve(failure(rawError))
    })
  }

  async sendToMainProcess<T extends MessageToMainType>(
    message: MessageToMain<T>
  ): AsyncResult<MessageResponse<MessageHandlerResult<T>>> {
    return await this.client.execute(
      async (
        message
      ): AsyncResult<MessageResponse<MessageHandlerResult<T>>> => {
        try {
          const result: MessageResponse<MessageHandlerResult<T>> =
            await window.electronApi.invokeMessage(message)
          return { value: result }
        } catch (thrownValue) {
          const error =
            thrownValue instanceof Error
              ? thrownValue
              : new Error(String(thrownValue))
          console.error('error invoking message', error)
          return { error }
        }
      },
      message
    )
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
