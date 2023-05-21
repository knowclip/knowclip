import { actions } from './actions'
import * as selectors from './selectors'

const redux = {
  ...actions,
  ...selectors,
}

export default redux
