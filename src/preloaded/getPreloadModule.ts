export function getPreloadModule<Key extends keyof Window['electronApi']>(
  electronApiKey: Key
) {
  const module = window?.electronApi?.[electronApiKey]
  if (!module) console.warn(`Preload module ${electronApiKey} not found`)
  else console.log(`Preload module ${electronApiKey} found`)
  return module
}
