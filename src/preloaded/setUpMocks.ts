import { getPreloadModule } from './getPreloadModule'

export const setUpMocks =
  getPreloadModule('setUpMocks') ||
  (<T>(moduleId: string, value: T): T => value)
