import sideEffects from './module'
import { setUpMocks } from '../../preloaded/setUpMocks'

const mocked = setUpMocks('side-effect', sideEffects)

const { uuid, nowUtcTimestamp } = mocked

export { uuid, nowUtcTimestamp }
