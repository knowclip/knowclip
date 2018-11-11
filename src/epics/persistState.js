import { ignoreElements } from 'rxjs/operators'
import { fromEvent } from 'rxjs'
import { ipcRenderer } from 'electron'

const persistStateEpic = (action$, state$) =>
  fromEvent(ipcRenderer, 'app-close', () => {
    window.localStorage.setItem('boopy', 'stroopy')
    ipcRenderer.send('closed')
  }).pipe(ignoreElements())

export default persistStateEpic
