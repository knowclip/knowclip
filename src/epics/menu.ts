import {
  filter,
  map,
  ignoreElements,
  mergeMap,
  mergeAll,
  take,
} from 'rxjs/operators'
import { combineEpics, ofType } from 'redux-observable'
import { EMPTY, of } from 'rxjs'
import r from '../redux'
import rcompare from 'semver/functions/rcompare'
import gt from 'semver/functions/gt'
import { REHYDRATE } from 'redux-persist'
import packageJson from '../../package.json'
import { VITE_BUILD_NUMBER, VITEST } from '../env'
import KnowclipActionType from '../types/ActionType'

const showSettingsDialog: AppEpic = (
  action$,
  state$,
  { fromIpcRendererEvent }
) =>
  fromIpcRendererEvent('show-settings-dialog').pipe(
    filter(() => !state$.value.dialog.queue.some((d) => d.type === 'Settings')),
    map(() => r.settingsDialog())
  )

const aboutMessage = [
  `Version ${packageJson.version}`,
  `Build #${VITE_BUILD_NUMBER || '[DEV BUILD]'}`,
  'Distributed under GNU Affero General Public License 3.0.',
  'Thanks to my dear patrons ♡ Phillip Allen, Towel Sniffer, Ryan Leach, Wei, Sky Beast',
  '© 2021 Justin Silvestre',
].join('\n\n')

const showAboutDialog: AppEpic = (
  action$,
  state$,
  { fromIpcRendererEvent, pauseMedia, sendToMainProcess }
) =>
  fromIpcRendererEvent('show-about-dialog').pipe(
    mergeMap(() => {
      pauseMedia()
      return sendToMainProcess({
        type: 'showAboutDialog',
        args: [aboutMessage],
      })
    }),
    ignoreElements()
  )

const saveProject: AppEpic = (action$, state$, { fromIpcRendererEvent }) =>
  fromIpcRendererEvent('save-project-request').pipe(
    map(() => r.saveProjectRequest())
  )

const closeProject: AppEpic = (action$, state$, { fromIpcRendererEvent }) =>
  fromIpcRendererEvent('close-project-request').pipe(
    map(() => r.closeProjectRequest())
  )

const undo: AppEpic = (action$, state$, { fromIpcRendererEvent }) =>
  fromIpcRendererEvent('undo').pipe(map(() => r.undo()))

const redo: AppEpic = (action$, state$, { fromIpcRendererEvent }) =>
  fromIpcRendererEvent('redo').pipe(map(() => r.redo()))

const openProject: AppEpic = (
  action$,
  state$,
  { fromIpcRendererEvent, showOpenDialog }
) =>
  fromIpcRendererEvent('open-project').pipe(
    mergeMap(
      async () =>
        await showOpenDialog([
          {
            name: 'Knowclip project file',
            extensions: ['kyml'],
          },
        ])
    ),

    mergeMap((filePaths) => {
      if (!filePaths) return EMPTY

      const filePath = filePaths[0]
      return of(r.openProjectRequestByFilePath(filePath))
    })
  )

const startupCheckForUpdates: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(REHYDRATE as KnowclipActionType),
    take(1),
    mergeMap(async () => {
      const { window, showMessageBox, openExternal } = effects
      const checkAtStartup = state$.value.settings.checkForUpdatesAutomatically
      if (!checkAtStartup) return EMPTY

      if (!window.navigator.onLine) return EMPTY

      const updatesCheck = await checkForUpdates()

      if (updatesCheck.errors) {
        const messageBoxResult = await showMessageBox({
          title: 'Check for updates',
          message:
            "The most recent update info can't be fetched at this time. Would you like to visit the web site to check for updates manually?",
          buttons: ['Yes', 'No thanks'],
          cancelId: 1,
        })

        if (messageBoxResult && messageBoxResult.response === 0)
          openExternal('https://knowclip.com/#download')

        return EMPTY
      }

      const newerReleases = updatesCheck.value

      const newSettings =
        Boolean(newerReleases.length) &&
        (await showDownloadPrompt(
          checkAtStartup,
          newerReleases[0],
          newerReleases,
          effects
        ))

      return newSettings ? of(r.overrideSettings(newSettings)) : EMPTY
    }),
    mergeAll()
  )

const menuCheckForUpdates: AppEpic = (action$, state$, effects) =>
  effects.fromIpcRendererEvent('check-for-updates').pipe(
    mergeMap(async () => {
      const { window, showMessageBox, openExternal } = effects
      if (!window.navigator.onLine) {
        const messageBoxResult = await showMessageBox({
          title: 'Check for updates',
          message:
            "The most recent update info can't be fetched at this time. Would you like to visit the web site to check for updates manually?",
          buttons: ['Yes', 'No thanks'],
          cancelId: 1,
        })

        if (messageBoxResult && messageBoxResult.response === 0)
          openExternal('https://knowclip.com/#download')

        return EMPTY
      }

      const updatesCheck = await checkForUpdates()

      if (updatesCheck.errors) {
        console.error(updatesCheck.errors.join('; '))
        return EMPTY
      }
      const checkAtStartup = state$.value.settings.checkForUpdatesAutomatically

      const { value: newerReleases } = updatesCheck
      const newSettings = newerReleases.length
        ? await showDownloadPrompt(
            checkAtStartup,
            newerReleases[0],
            newerReleases,
            effects
          )
        : await showUpToDateMessageBox(checkAtStartup, effects)

      return newSettings ? of(r.overrideSettings(newSettings)) : EMPTY
    }),
    mergeAll()
  )

const checkForUpdates = VITEST
  ? async (): Promise<Result<{ tag_name: string; body: string }[]>> => ({
      value: [],
    })
  : async (): Promise<Result<{ tag_name: string; body: string }[]>> => {
      try {
        const response = await fetch(
          'https://api.github.com/repos/knowclip/knowclip/releases',
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
            },
          }
        )
        const releases: {
          tag_name: string
          body: string
        }[] = await response.json()

        const newerReleases = releases
          .sort((r1, r2) => rcompare(r1.tag_name, r2.tag_name))
          .filter(({ tag_name: tagName }) => gt(tagName, packageJson.version))

        return { value: newerReleases }
      } catch (err) {
        return { errors: [`${err}`] }
      }
    }

async function showDownloadPrompt(
  checkAtStartup: boolean,
  newestRelease: { tag_name: string; body: string },
  newerReleases: { tag_name: string; body: string }[],
  effects: EpicsDependencies
): Promise<Partial<SettingsState> | null> {
  const messageBoxResult = await effects.showMessageBox({
    title: 'An update is available!',
    message:
      `An newer version of Knowclip (${newestRelease.tag_name}) is currently available for download.\n\n` +
      `Updates include:\n${[
        ...new Set(
          newerReleases.flatMap((r) =>
            r.body
              .split(/\n+/)
              .filter((s) => s.trim())
              .map((line) => ` ${line}`)
          )
        ),
      ].join('\n')}\n\n` +
      `Would you like to go to the download page now?\n`,
    checkboxChecked: checkAtStartup,
    checkboxLabel: 'Check for updates again next time I open Knowclip',
    buttons: ['Visit download page', 'No thanks'],
    cancelId: 1,
  })
  if (messageBoxResult) {
    if (messageBoxResult.response === 0)
      effects.openExternal('https://knowclip.com/#download')

    const checkAtStartupChanged =
      messageBoxResult && messageBoxResult.checkboxChecked !== checkAtStartup
    return checkAtStartupChanged
      ? { checkForUpdatesAutomatically: messageBoxResult.checkboxChecked }
      : null
  }

  return null
}

async function showUpToDateMessageBox(
  checkAtStartup: boolean,
  effects: EpicsDependencies
) {
  const messageBoxResult = await effects.showMessageBox({
    title: `You're up to date!`,
    message: `You're already running the latest version of Knowclip (${packageJson.version}).`,
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
  undo,
  redo,
  startupCheckForUpdates,
  menuCheckForUpdates
)
