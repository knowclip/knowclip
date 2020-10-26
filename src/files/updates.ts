import { updates as media } from './mediaFile'
import { updates as project } from './projectFile'
import { updates as dictionary } from './dictionaryFile'

export const fileUpdates = {
  ...media,
  ...project,
  ...dictionary,
} as const

export type FileUpdates = typeof fileUpdates

export function isUpdateWith<U extends keyof FileUpdates>(
  updateName: U,
  action: UpdateFileWith<any>
): action is UpdateFileWith<U> {
  return action.update.updateName === updateName
}

export type ProjectFileUpdates = typeof project
