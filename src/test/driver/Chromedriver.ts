import { type ChildProcess, spawn } from 'child_process'

export default class Chromedriver {
  process: ChildProcess
  statusUrl: string

  stop: () => boolean

  constructor(
    path: string,
    {
      env,
      showBrowserLogs = false,
      statusUrl,
      args = [],
    }: {
      env?: NodeJS.ProcessEnv
      showBrowserLogs?: boolean
      statusUrl: string
      args?: string[]
    }
  ) {
    this.process = spawn(path, args, {
      cwd: process.cwd(),
      env,
    })
    this.statusUrl = statusUrl

    const stdout = (chunk: any) => {
      console.log('RENDERER LOG: ' + chunk)
    }
    if (showBrowserLogs && this.process.stdout) {
      this.process.stdout.on('data', stdout)
    }

    const chromedriverCloseHandler = (code: any, ...args: any[]) => {
      console.log(`closing chromedriver ${code}, ${args}`)
      if (code !== 0) {
        throw new Error(`Chromedriver exited with error code: ${code}, ${args}`)
      }
    }
    this.process.on('error', (error) => {
      const errorString = String(error)
      console.error(`CHROMEDRIVER: ${errorString}`)
      throw new Error(errorString)
    })

    process.on('exit', this._kill)
    process.on('SIGTERM', this._kill)

    this.stop = () => {
      process.removeListener('exit', this._kill)
      process.removeListener('SIGTERM', this._kill)
      if (this.process.stdout)
        this.process.stdout.removeListener('data', stdout)

      // @ts-expect-error typings probably outdated
      this._kill = null
      // @ts-expect-error typings probably outdated
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
