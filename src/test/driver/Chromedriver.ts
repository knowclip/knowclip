import ChildProcess from 'child_process'
import path from 'path'
import chromedriver from 'chromedriver'
import { getStartUrl } from '../../../electron/window'

// chrome version 85.0.4183.98

export default class Chromedriver {
  process: ReturnType<typeof ChildProcess.spawn>

  stop: () => Boolean

  constructor(
    path: string,
    args: string[],
    {
      env,
      showBrowserLogs = false,
    }: { env?: NodeJS.ProcessEnv; showBrowserLogs?: boolean } = {}
  ) {
    this.process = startChromedriver(path, args, env)

    const stdout = (chunk: any) => {
      console.log('RENDERER LOG: ' + chunk)
    }
    if (showBrowserLogs && this.process.stdout) {
      this.process.stdout.on('data', stdout)
    }

    const chromedriverCloseHandler = (code: any, ...args: any[]) => {
      console.log(`closing chrome driver ${code}, ${args}`)
      if (code !== 0) {
        throw new Error(`Chromedriver exited with error code: ${code}, ${args}`)
      }
    }
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
      if (this.process.stdout)
        this.process.stdout.removeListener('data', stdout)

      // @ts-ignore
      this._kill = null
      // @ts-ignore
      this.stop = null

      this.process.removeListener('close', chromedriverCloseHandler)

      const killed = this.process.kill('SIGTERM')
      if (!killed) console.error(`Failed to kill Chromedriver process.`)

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

function startChromedriver(
  path: string,
  args: string[],
  env?: NodeJS.ProcessEnv
) {
  return ChildProcess.spawn(path, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
  })
}
