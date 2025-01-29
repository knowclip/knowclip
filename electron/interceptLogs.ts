import * as path from 'path'
import { appendFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import filenamify from 'filenamify'

export function interceptLogs(testId: string) {
  const originalConsoleLog = console.log
  const originalConsoleError = console.error
  const logDir = path.join(process.cwd(), 'logs')
  if (!existsSync(logDir)) {
    mkdirSync(logDir)
  }
  const logFilePath = path.join(
    process.cwd(),
    'logs',
    `${testId}_main-process_${filenamify(
      new Date(Date.now()).toISOString()
    )}.log`
  )
  writeFileSync(logFilePath, '')
  console.log = (...args: any[]) => {
    appendFileSync(logFilePath, JSON.stringify(args, null, 2))
    originalConsoleLog(...args)
  }
  console.error = (...args: any[]) => {
    appendFileSync(
      logFilePath,
      `           ERROR: ${JSON.stringify(args, null, 2)}`
    )
    originalConsoleError(...args)
  }
}
