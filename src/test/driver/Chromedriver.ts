import ChildProcess from 'child_process'
import path from 'path'
import chromedriver from 'chromedriver'
import { getStartUrl } from '../../../electron/window'

// chrome version 85.0.4183.98

// // https://github.com/giggio/node-chromedriver/blob/main/bin/chromedriver
// const binaryPath = require(path.join(process.cwd(), "node_modules", "chromedriver", "lib", "chromedriver")).path;

export default class Chromedriver {
  process: ReturnType<typeof ChildProcess.spawn>

  stop: () => Boolean

  constructor(args: string[]) {
    this.process = chromedriver.start([
      // `--homepage=${getStartUrl(process.env.ELECTRON_START_URL)}`
      `--homepage=http://localhost:3000`,
      '--port=' + 9515,
      '--url-base=' + '/',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--log-level=info',
      ...args,
    ])

    // startChromedriver(args, env)

    const chromedriverCloseHandler = (code: any, ...args: any[]) => {
      console.log(`closing chrome driver ${code}, ${args}`)
      if (code !== 0) {
        throw new Error(`Chromedriver exited with error code: ${code}, ${args}`)
      }
    }
    this.process.on('close', chromedriverCloseHandler)
    this.process.on('error', (error: any) => {
      throw new Error(error)
    })

    process.on('exit', this._kill)
    process.on('SIGTERM', this._kill)

    this.stop = () => {
      // @ts-ignore
      process.removeListener('exit', this._kill)
      // @ts-ignore
      process.removeListener('SIGTERM', this._kill)

      // @ts-ignore
      this._kill = null
      // @ts-ignore
      this.stop = null

      this.process.removeListener('close', chromedriverCloseHandler)

      // TODO: investigate if this is better
      //    and maybe include 'wait for stop'
      // const x = chromedriver.stop()
      const killed = this.process.kill('SIGTERM')
      console.log('Chromedriver process killed?', { success: killed })

      return killed
    }
  }

  _kill() {
    try {
      this.process.kill()
    } catch (err) {
      console.error('Problem killing Chromedriver process:')
      console.error(err)
    }
  }
}

function startChromedriver(args: string[], env: any) {
  return ChildProcess.spawn(chromedriver.path, args)
}
