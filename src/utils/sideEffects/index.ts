import sideEffects from './module'
import spectronMocks from '../../test/spectronMocks'

const {
  mocked,
  mockFunctions: mockSideEffects,
  logMocks: logSideEffectsMocks,
} = spectronMocks('side-effect', sideEffects)

export { mockSideEffects, logSideEffectsMocks }

const { uuid, nowUtcTimestamp } =
  process.env.REACT_APP_CHROMEDRIVER || process.env.NODE_ENV === 'test'
    ? mocked
    : sideEffects

export { uuid, nowUtcTimestamp }
