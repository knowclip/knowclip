import helpers from './helpers'
import spectronMocks from '../../test/spectronMocks'

const { mockFunctions } = spectronMocks('electron-helper', helpers)

export const mockElectronHelpers = mockFunctions
