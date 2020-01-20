import sideEffects from './module'
import setUpMocks from '../../test/setUpMocks'

const {
  mocked,
  mockFunctions: mockSideEffects,
  logMocks: logSideEffectsMocks,
} = setUpMocks('side-effect', sideEffects)

export { mockSideEffects, logSideEffectsMocks }

const { uuid, nowUtcTimestamp } =
  process.env.REACT_APP_SPECTRON || process.env.NODE_ENV === 'test'
    ? mocked
    : sideEffects

export { uuid, nowUtcTimestamp }
