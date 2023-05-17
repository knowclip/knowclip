const {
  VITEST,
  VITE_BUILD_NUMBER,
  DEV,
  VITE_INTEGRATION_DEV,
  PERSISTED_STATE_PATH,
  NODE_ENV,
} = ('window' in globalThis && window.electronApi?.env) || process.env

export {
  VITEST,
  VITE_BUILD_NUMBER,
  DEV,
  VITE_INTEGRATION_DEV,
  PERSISTED_STATE_PATH,
  NODE_ENV,
}
