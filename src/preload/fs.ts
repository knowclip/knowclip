import promisesOriginal from 'fs/promises'
export { existsSync } from 'fs'

export const readFile = (path: string) =>
  promisesOriginal.readFile(path, 'utf8')

export const writeFile = (path: string, data: string) =>
  promisesOriginal.writeFile(path, data)
