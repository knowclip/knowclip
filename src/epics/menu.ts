import {
  filter,
  map,
  ignoreElements,
  tap,
  flatMap,
  mergeAll,
  take,
} from 'rxjs/operators'
import { combineEpics } from 'redux-observable'
import { fromEvent, empty, of } from 'rxjs'
import r from '../redux'
import { showMessageBox, showOpenDialog } from '../utils/electron'
import electron, { shell } from 'electron'
import rcompare from 'semver/functions/rcompare'
import gt from 'semver/functions/gt'
import { join } from 'path'
import { REHYDRATE } from 'redux-persist'

const showSettingsDialog: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'show-settings-dialog').pipe(
    filter(() => !state$.value.dialog.queue.some((d) => d.type === 'Settings')),
    map(() => r.settingsDialog())
  )

const aboutMessage = [
  `Version ${electron.remote.app.getVersion()}`,
  `Build #${process.env.REACT_APP_BUILD_NUMBER || '[DEV BUILD]'}`,
  'Distributed under GNU Affero General Public License 3.0.',
  '© 2020 Justin Silvestre',
].join('\n\n')

const showAboutDialog: AppEpic = (action$, state$, { ipcRenderer }) =>
  fromEvent(ipcRenderer, 'show-about-dialog').pipe(
    flatMap(() =>
      showMessageBox({
        type: 'info',
        icon: electron.remote.nativeImage.createFromPath(
          join(electron.remote.process.cwd(), 'icons', 'icon.png')
        ),
        title: 'Knowclip v' + electron.remote.app.getVersion(),
        message: aboutMessage,
        buttons: ['OK', 'Go to website'],
      })
    ),
    tap((messageBoxReturnValue) => {
      if (messageBoxReturnValue) {
        if (messageBoxReturnValue.response === 1)
          shell.openExternal('http://knowclip.com')
      }
    }),
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

    flatMap((filePaths) => {
      if (!filePaths) return empty()

      const filePath = filePaths[0]
      return of(r.openProjectRequestByFilePath(filePath))
    })
  )

const startupCheckForUpdates: AppEpic = (action$, state$, { window }) =>
  action$.ofType<any>(REHYDRATE).pipe(
    take(1),
    flatMap(async () => {
      const checkAtStartup = state$.value.settings.checkForUpdatesAutomatically
      if (!checkAtStartup) return empty()

      if (!window.navigator.onLine) return empty()

      const { errors, value: newestRelease } = await checkForUpdates()

      if (errors) {
        const messageBoxResult = await showMessageBox({
          title: 'Check for updates',
          message:
            "The most recent update info can't be fetched at this time. Would you like to visit the web site to check for updates manually?",
          buttons: ['Yes', 'No thanks'],
          cancelId: 1,
        })

        if (messageBoxResult && messageBoxResult.response === 0)
          electron.shell.openExternal(
            'https://github.com/knowclip/knowclip/releases'
          )
      }

      const newSettings =
        newestRelease &&
        (await showDownloadPrompt(checkAtStartup, newestRelease.tag_name))

      return newSettings ? of(r.overrideSettings(newSettings)) : empty()
    }),
    mergeAll()
  )

const menuCheckForUpdates: AppEpic = (
  action$,
  state$,
  { ipcRenderer, window }
) =>
  fromEvent(ipcRenderer, 'check-for-updates').pipe(
    flatMap(async () => {
      if (!window.navigator.onLine) {
        const messageBoxResult = await showMessageBox({
          title: 'Check for updates',
          message:
            "The most recent update info can't be fetched at this time. Would you like to visit the web site to check for updates manually?",
          buttons: ['Yes', 'No thanks'],
          cancelId: 1,
        })

        if (messageBoxResult && messageBoxResult.response === 0)
          electron.shell.openExternal(
            'https://github.com/knowclip/knowclip/releases'
          )

        return empty()
      }

      const { errors, value: newestRelease } = await checkForUpdates()

      if (errors) {
        console.error(errors.join('; '))
        return empty()
      }
      const checkAtStartup = state$.value.settings.checkForUpdatesAutomatically

      const newSettings = newestRelease
        ? await showDownloadPrompt(checkAtStartup, newestRelease.tag_name)
        : await showUpToDateMessageBox(checkAtStartup)

      return newSettings ? of(r.overrideSettings(newSettings)) : empty()
    }),
    mergeAll()
  )

const checkForUpdates = process.env.REACT_APP_SPECTRON
  ? async (): Promise<Result<{ tag_name: string } | null>> => ({
      value: null,
    })
  : async (): Promise<Result<{ tag_name: string } | null>> => {
      try {
        const response = await fetch(
          'https://api.github.com/repos/knowclip/knowclip/releases',
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
            },
          }
        )
        const releases: { tag_name: string }[] = await response.json()
        const newestRelease = releases

          .sort((r1, r2) => rcompare(r1.tag_name, r2.tag_name))
          .find(({ tag_name: tagName }) =>
            gt(tagName, electron.remote.app.getVersion())
          )

        return { value: newestRelease || null }
      } catch (err) {
        return { errors: [`${err}`] }
      }
    }

async function showDownloadPrompt(
  checkAtStartup: boolean,
  tagName: string
): Promise<Partial<SettingsState> | null> {
  const messageBoxResult = await showMessageBox({
    title: 'An update is available!',
    message: `An newer version of Knowclip (${tagName}) is currently available for download.\n
Would you like to go to the download page now for details?\n`,
    checkboxChecked: checkAtStartup,
    checkboxLabel: 'Check for updates again next time I open Knowclip',
    buttons: ['Yes', 'No thanks'],
    cancelId: 1,
  })
  if (messageBoxResult) {
    if (messageBoxResult.response === 0)
      electron.shell.openExternal(
        'https://github.com/knowclip/knowclip/releases'
      )

    const checkAtStartupChanged =
      messageBoxResult && messageBoxResult.checkboxChecked !== checkAtStartup
    return checkAtStartupChanged
      ? { checkForUpdatesAutomatically: messageBoxResult.checkboxChecked }
      : null
  }

  return null
}

async function showUpToDateMessageBox(checkAtStartup: boolean) {
  const messageBoxResult = await showMessageBox({
    title: `You're up to date!`,
    message: `You're already running the latest version of Knowclip (${electron.remote.app.getVersion()}).`,
    checkboxLabel: 'Check for updates again next time I open Knowclip',
    checkboxChecked: checkAtStartup,
    buttons: ['OK'],
    cancelId: 1,
  })

  if (messageBoxResult) {
    const checkAtStartupChanged =
      messageBoxResult && messageBoxResult.checkboxChecked !== checkAtStartup
    return checkAtStartupChanged
      ? { checkForUpdatesAutomatically: messageBoxResult.checkboxChecked }
      : null
  }
  return null
}

export default combineEpics(
  showSettingsDialog,
  showAboutDialog,
  saveProject,
  closeProject,
  openProject,
  startupCheckForUpdates,
  menuCheckForUpdates
)
