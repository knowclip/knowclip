import helpers from './helpers'
import mockFunctions from '../../test/getFunctionMockers'

// IF THIS IS REERENCED OUTSIDE OF TESTS, this should use preload stuff, maybe on window?
// but i dont think it is
export const mockElectronHelpers =
  mockFunctions<typeof helpers>('electron-helper')
