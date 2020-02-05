import { filter, map, ignoreElements, tap, flatMap } from 'rxjs/operators'
import { combineEpics } from 'redux-observable'
import { fromEvent, from, empty, of } from 'rxjs'
import * as r from '../redux'
import { AppEpic } from '../types/AppEpic'
import { showMessageBox, showOpenDialog } from '../utils/electron'

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

const saveProject: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'save-project').pipe(map(() => r.saveProjectRequest()))

const closeProject: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'close-project').pipe(
    map(() => r.closeProjectRequest())
  )

const openProject: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'open-project').pipe(
    flatMap(
      async () =>
        await showOpenDialog([
          {
            name: 'Knowclip project file',
            extensions: ['kyml'],
          },
        ])
    ),

    flatMap(filePaths => {
      if (!filePaths) return empty()

      const filePath = filePaths[0]
      return of(r.openProjectByFilePath(filePath))
    })
  )

export default combineEpics(
  showSettingsDialog,
  showAboutDialog,
  saveProject,
  closeProject,
  openProject
)
