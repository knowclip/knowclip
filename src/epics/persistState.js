import { ignoreElements } from 'rxjs/operators'
import { fromEvent } from 'rxjs'
import { ipcRenderer } from 'electron'
import { persistState } from '../utils/statePersistence'

const persistStateEpic = (action$, state$) =>
  fromEvent(ipcRenderer, 'app-close', () => {
    persistState(state$.value)

    ipcRenderer.send('closed')
  }).pipe(ignoreElements())

export default persistStateEpic
