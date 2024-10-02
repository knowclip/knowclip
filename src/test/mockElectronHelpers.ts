import helpers from '../mockable/electron/helpers'
import mockFunctions from './getFunctionMockers'

export const mockElectronHelpers =
  mockFunctions<typeof helpers>('electron-helper')
