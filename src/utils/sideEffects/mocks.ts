import sideEffects from './module'
import mockFunctions from '../../test/getFunctionMockers'

export const mockSideEffects = mockFunctions<typeof sideEffects>('side-effect')
