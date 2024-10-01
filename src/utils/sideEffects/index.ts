import sideEffects from './module'
import { setUpMocks } from 'preloaded/setUpMocks'
//
// // maybe this mocking should happen during preload.
// // this may be the reason (down the line) why vite/rollup is complaining,
// // namely if this module is referenced in the main process.
const mocked = setUpMocks('side-effect', sideEffects)
//
const { uuid, nowUtcTimestamp } = mocked

// const { uuid, nowUtcTimestamp } = sideEffects

export { uuid, nowUtcTimestamp }
