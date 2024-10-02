import sideEffects from '../mockable/sideEffects/module'
import mockFunctions from './getFunctionMockers'

export const mockSideEffects = mockFunctions<typeof sideEffects>('side-effect')
