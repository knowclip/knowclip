import fs from 'fs'
import { promises } from 'fs'

export { existsSync } from 'fs'

export const readFile = (path: string) => promises.readFile(path, 'utf8')

export const writeFile = (path: string, data: string) =>
  promises.writeFile(path, data, 'utf8')

export const writeFileSync = (path: string, data: string) =>
  fs.writeFileSync(path, data)
