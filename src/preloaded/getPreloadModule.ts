export function getPreloadModule<Key extends keyof Window['electronApi']>(
  electronApiKey: Key
) {
  const module =
    'window' in globalThis ? window?.electronApi?.[electronApiKey] : null
  if (!module) console.warn(`Preload module ${electronApiKey} not found`)
  else console.log(`Preload module ${electronApiKey} found`, module)
  return module as Window['electronApi'][Key]
}
