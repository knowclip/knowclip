import { actions } from './actions'
import * as selectors from './selectors'

export * from './types/ActionType'

export default {
  ...actions,
  ...selectors
}