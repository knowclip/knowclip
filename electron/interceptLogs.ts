import * as path from 'path'
import { appendFileSync, writeFileSync } from 'fs'
import filenamify from 'filenamify'

export function interceptLogs() {
  try {
  const originalConsoleLog = console.log
  const originalConsoleError = console.error
  const logFilePath = path.join(
    process.cwd(),
    `electron-${filenamify(new Date(Date.now()).toISOString())}.log`
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
