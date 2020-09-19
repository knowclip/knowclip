import ChildProcess from 'child_process'
import path from 'path'

// https://github.com/giggio/node-chromedriver/blob/main/bin/chromedriver
const BIN_PATH = require(path.join(
  process.cwd(),
  'node_modules',
  'chromedriver',
  'lib',
  'chromedriver'
)).path

export default class Chromedriver {
  process: ReturnType<typeof ChildProcess.spawn>

  stop: () => Boolean

  constructor(args: string[], env: any) {
    this.process = startChromedriver(args, env)

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
  return ChildProcess.spawn(
    BIN_PATH,
    args //    {
    //   cwd: process.cwd(),
    //   // https://www.electronjs.org/docs/tutorial/automated-testing-with-a-custom-driver
    //   // stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    //   stdio: 'inherit',
    // }
  )
}
