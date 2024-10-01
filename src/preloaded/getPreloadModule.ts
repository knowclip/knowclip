export function getPreloadModule<Key extends keyof Window['electronApi']>(
  electronApiKey: Key
) {
  const module =
    'window' in globalThis ? window?.electronApi?.[electronApiKey] : null
  if (!module) {
    throw new Error(
      `Preload module ${electronApiKey} not found. If you are seeing this in the main process, something is wrong`
    )
  } else console.log(`Preload module ${electronApiKey} found`, module)
  return module as Window['electronApi'][Key]
}
