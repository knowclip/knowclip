import { ActionCreatorNameOf } from '.'
import ActionType from '../types/ActionType'

/** simply makes sure the return types and names of actions creators are correct */
export function defineActionCreators<
  T extends ActionType,
  ActionCreators extends Partial<{
    [ACN in ActionCreatorNameOf<T>]: (...args: never[]) => {
      type: (typeof ActionType)[ACN]
    }
  }>
>(actionsCreators: ActionCreators) {
  return actionsCreators
}
