import type { ElectronApi } from '.'

export function getPreloadModule<Key extends keyof ElectronApi>(
  electronApiKey: Key
) {
  return window?.electronApi?.[electronApiKey]
}
