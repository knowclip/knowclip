import { updates as media } from './mediaFile'
import { updates as project } from './projectFile'
import { updates as dictionary } from './dictionaryFile'

export const fileUpdates = {
  ...media,
  ...project,
  ...dictionary,
} as const

export type AppFileUpdates = typeof fileUpdates

export { FileUpdateName } from './FileUpdateName'

export type ProjectFileUpdates = typeof project
