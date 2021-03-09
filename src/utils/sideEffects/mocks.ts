import sideEffects from './module'
import spectronMocks from '../../test/spectronMocks'

const {
  mockFunctions: mockSideEffects,
  logMocks: logSideEffectsMocks,
} = spectronMocks('side-effect', sideEffects)

export { mockSideEffects, logSideEffectsMocks }
