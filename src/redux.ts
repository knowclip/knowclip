import { actions } from './actions'
import * as selectors from './selectors'

export * from './types/ActionType'

const redux = {
  ...actions,
  ...selectors
}

export default redux