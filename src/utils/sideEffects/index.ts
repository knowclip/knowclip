import sideEffects from './module'
import spectronMocks from '../../test/spectronMocks'

const {
  module: mocked,
} = spectronMocks('side-effect', sideEffects)

const { uuid, nowUtcTimestamp } = mocked

export { uuid, nowUtcTimestamp }
