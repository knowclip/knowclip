import { updates as media } from './mediaFile'
import { updates as project } from './projectFile'
import { updates as dictionary } from './dictionaryFile'

export const fileUpdates = {
  ...media,
  ...project,
  ...dictionary,
} as const

export type FileUpdates = typeof fileUpdates

export function getUpdateWith<U extends keyof FileUpdates>(
  update: FileUpdate<any>,
  updateName: U
): FileUpdate<U> | null {
  if (update.updateName === updateName) return update as FileUpdate<U>
  return null
}
export type ProjectFileUpdates = typeof project
