import {
  BrowserWindow,
  dialog,
  nativeImage,
  app,
  shell,
  FileFilter,
  Menu,
  MessageBoxOptions,
} from 'electron'
import { readFileSync, promises, existsSync } from 'fs'
import * as path from 'path'
import { requestParseDictionary } from './utils/dictionaries/requestParseDictionary'
import moment from 'moment'
import { getPersistedDataSnapshot } from './test/getPersistedDataSnapshot'
import { getMediaMetadata, readMediaFile } from './node/ffmpeg'
import { getVideoStill } from './node/getVideoStill'
import { getApkgExportData } from './node/prepareExport'
import { temporaryDirectory, temporaryFile } from 'tempy'
import {
  getSubtitlesFilePath,
  getSubtitlesFromFile,
  validateBeforeOpenFileAction,
  validateSubtitlesFromFilePath,
} from './node/subtitles'
import { processNoteMedia } from './node/processNoteMedia'
import { coerceMp3ToConstantBitrate } from './node/constantBitrateMp3'
import { getWaveformPng, getWaveformPngs } from './node/getWaveform'
import { readdir } from 'fs-extra'
import { parseProjectJson } from './node/parseProject'
import { writeApkgDeck } from './node/writeToApkg'

export type MessageResponders = ReturnType<typeof getMessageResponders>

const now = moment.utc().format()

import Store from 'electron-store'

const electronStore = new Store()
const electronStorage = {
  getItem: async (key: string) => electronStore.get(key),
  setItem: async (key: string, item: any) => electronStore.set(key, item),
  removeItem: async (key: string) => electronStore.delete(key),
}

export const getMessageResponders = (
  mainWindow: BrowserWindow,
  ffmpegPaths: { ffmpeg: string; ffprobe: string },
  persistedStatePath?: string
) => ({
  isReady: () => 'ok' as const,
  getFfmpegAndFfprobePath: () => {
    return ffmpegPaths
  },
  log: (...args: any[]) => {
    console.log(...args)
  },
  openExternal: (path: string) => shell.openExternal(path),
  /** for sending messages to renderer during integration tests */
  sendToRenderer: (channel: string, args: string[]) => {
    if (!mainWindow) console.error('Main window reference lost')
    else mainWindow.webContents.send(channel, ...args)
  },

  getPersistedTestState: async () => {
    const initialState: Partial<AppState> | undefined = persistedStatePath
      ? JSON.parse(readFileSync(persistedStatePath, 'utf8'))
      : undefined

    return initialState
  },
  sendInputEvent: (
    inputEvent:
      | Electron.MouseInputEvent
      | Electron.MouseWheelInputEvent
      | Electron.KeyboardInputEvent
  ) => {
    if (!mainWindow) console.error('Main window reference lost')
    else mainWindow.webContents.sendInputEvent(inputEvent)
  },
  showOpenDialog: (filters: Array<FileFilter>, multiSelections: boolean) =>
    dialog.showOpenDialog(mainWindow, {
      properties: multiSelections
        ? ['openFile', 'multiSelections']
        : ['openFile'],
      filters,
    }),
  showOpenDirectoryDialog: (showHiddenFiles: boolean) =>
    dialog.showOpenDialog({
      properties: [
        'openDirectory' as const,
        ...(showHiddenFiles ? (['showHiddenFiles'] as const) : []),
      ],
    }),
  showOpenDirectoriesDialog: (showHiddenFiles: boolean) =>
    dialog.showOpenDialog(mainWindow, {
      properties: [
        'openDirectory' as const,
        'multiSelections' as const,
        ...(showHiddenFiles ? (['showHiddenFiles'] as const) : []),
      ],
    }),
  showSaveDialog: (name: string, extensions: Array<string>) =>
    dialog.showSaveDialog({
      filters: [{ name, extensions }],
    }),
  showMessageBox: (
    options: Pick<
      MessageBoxOptions,
      | 'type'
      | 'title'
      | 'message'
      | 'checkboxChecked'
      | 'checkboxLabel'
      | 'buttons'
      | 'cancelId'
    >
  ) => dialog.showMessageBox(mainWindow, options),
  showAboutDialog: async (aboutMessage: string) => {
    // should pause media also
    const messageBoxReturnValue = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      icon: nativeImage.createFromPath(
        path.join(process.cwd(), 'icons', 'icon.png')
      ),
      title: 'Knowclip v' + app.getVersion(),
      message: aboutMessage,
      buttons: ['OK', 'Go to website'],
    })
    if (messageBoxReturnValue) {
      if (messageBoxReturnValue.response === 1)
        shell.openExternal('http://knowclip.com')
    }
  },
  setAppMenuProjectSubmenuPermissions(projectOpened: boolean) {
    const menu = Menu.getApplicationMenu()
    const submenu = menu ? menu.getMenuItemById('File')?.submenu : null
    if (!submenu) return

    const saveProject = submenu.getMenuItemById('Save project')
    const closeProject = submenu.getMenuItemById('Close project')
    if (saveProject) saveProject.enabled = projectOpened
    if (closeProject) closeProject.enabled = projectOpened

    const openProject = submenu.getMenuItemById('Open project')
    if (openProject) openProject.enabled = !projectOpened
  },
  openDictionaryFile(file: DictionaryFile, filePath: string) {
    return requestParseDictionary(file, filePath, mainWindow)
  },
  pathBasename(filePath: string) {
    return path.basename(filePath)
  },
  pathExtname(filePath: string) {
    return path.extname(filePath)
  },
  pathDirname(filePath: string) {
    return path.dirname(filePath)
  },
  pathJoin(...segments: string[]) {
    return path.join(...segments)
  },
  writeTextFile(filePath: string, text: string) {
    return promises.writeFile(filePath, text, 'utf8')
  },
  logPersistedDataSnapshot: (
    testId: string,
    directories: Record<string, string>,
    appState: AppState
  ) => {
    const snapshot = getPersistedDataSnapshot(
      appState,
      testId,
      directories as unknown as any
    )

    console.log(snapshot)
    snapshot.keepTmpFiles()
    console.log(snapshot.json)

    return promises.writeFile(
      path.join(process.cwd(), testId + '_persistedDataSnapshot.js'),
      snapshot.json
    )
  },
  writeMocksLog: (
    testId: string,
    moduleId: string,
    logged: { [key: string]: any[] }
  ) => {
    const logFilePath = path.join(
      process.cwd(),
      `${testId && testId + '__'}${moduleId}-mocks-${now}.log`
    )
    return promises.writeFile(logFilePath, JSON.stringify(logged, null, 2))
  },
  getMediaMetadata,
  getVideoStill,
  getApkgExportData,
  writeApkgDeck,
  getSubtitlesFilePath,
  getSubtitlesFromFile,
  processNoteMedia,
  coerceMp3ToConstantBitrate,
  getWaveformPng,
  getWaveformPngs,
  validateSubtitleFileBeforeOpen: validateBeforeOpenFileAction,
  validateSubtitlesFromFilePath,
  fileExists: async (filePath: string) => existsSync(filePath),
  writeFile: promises.writeFile,
  temporaryDirectory: async () => temporaryDirectory(),
  temporaryFile: async () => temporaryFile(),
  readdir: (path: string) => readdir(path),
  readMediaFile,
  parseProjectJson,

  electronStoreSet: electronStorage.setItem,
  electronStoreGet: electronStorage.getItem,
  electronStoreRemove: electronStorage.removeItem,
})

export type AppState = any
