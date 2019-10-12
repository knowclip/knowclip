import * as actionTypes from '../types/ActionType'

declare global {
  type ActionType = typeof actionTypes
  const A: ActionType

  interface Window {
    A: ActionType
  }
}
window.A = actionTypes

export const checkForUnusedActionTypes: {
  [t: string]: Action['type']
} = actionTypes
