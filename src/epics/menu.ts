import { filter, map, ignoreElements, tap } from 'rxjs/operators'
import { combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { showMessageBox } from '../utils/electron'

const showSettingsDialog: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'show-settings-dialog').pipe(
    filter(() => !state$.value.dialog.queue.some(d => d.type === 'Settings')),
    map(() => r.settingsDialog())
  )

const showAboutDialog: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'show-about-dialog').pipe(
    tap(() =>
      showMessageBox({
        title: 'Knowclip v0',
        message: '© 2020 Justin Silvestre',
        buttons: ['OK'],
      })
    ),
    ignoreElements()
  )

export default combineEpics(showSettingsDialog, showAboutDialog)
