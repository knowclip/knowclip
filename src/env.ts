const {
  VITEST,
  BUILD_NUMBER,
  DEV,
  VITE_INTEGRATION_DEV,
  PERSISTED_STATE_PATH,
  NODE_ENV,
} = ('window' in globalThis && window.electronApi?.env) || process.env

export {
  VITEST,
  BUILD_NUMBER,
  DEV,
  VITE_INTEGRATION_DEV,
  PERSISTED_STATE_PATH,
  NODE_ENV,
}
