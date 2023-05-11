import type { ElectronApi } from '../preload'

export function getPreloadModule<Key extends keyof ElectronApi>(
  electronApiKey: Key
) {
  const module = window?.electronApi?.[electronApiKey]
  if (!module) console.warn(`Preload module ${electronApiKey} not found`)
  else console.log(`Preload module ${electronApiKey} found`)
  return module
}
