import type { ElectronApi } from '../preload'

export function getPreloadModule<Key extends keyof ElectronApi>(
  electronApiKey: Key
) {
  return window?.electronApi?.[electronApiKey]
}
