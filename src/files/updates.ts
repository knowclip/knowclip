import { updates as media } from './mediaFile'
import { updates as project } from './projectFile'

export const fileUpdates = {
  ...media,
  ...project,
} as const

export type FileUpdates = typeof fileUpdates

export function isUpdateWith<U extends keyof FileUpdates>(
  updateName: U,
  action: UpdateFileWith<any>
): action is UpdateFileWith<U> {
  return action.update.updateName === updateName
}
