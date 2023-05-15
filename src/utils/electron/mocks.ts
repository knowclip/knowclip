import helpers from './helpers'
import mockFunctions from '../../test/getFunctionMockers'

export const mockElectronHelpers =
  mockFunctions<typeof helpers>('electron-helper')
