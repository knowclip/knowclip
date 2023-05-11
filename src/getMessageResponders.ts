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
import { readFileSync } from 'fs'
import { join } from 'path'

export type MessageToMain<T extends MessageToMainType> = {
  type: T
  args: Parameters<MessageResponders[T]>
}

export type MessageResponders = ReturnType<typeof getMessageResponders>
export type MessageToMainType = keyof MessageResponders

export type MessageHandlerResult<T extends MessageToMainType> = ReturnType<
  MessageResponders[T]
>

export type MessageResponse<R> =
  | { result: R; error?: undefined }
  | { result?: undefined; error: { message: string; stack: any; name: string } }

export const getMessageResponders = (mainWindow: BrowserWindow) => ({
  isReady: () => true,
  getFfmpegAndFfprobePath: () => {
    const { ffmpegpath, ffprobepath } = global as any

    return {
      ffmpegpath: ffmpegpath as string,
      ffprobepath: ffprobepath as string,
    }
  },
  log: (...args: any[]) => {
    console.log(...args)
  },
  /** for sending messages to renderer during integration tests */
  sendToRenderer: (channel: string, args: string[]) => {
    if (!mainWindow) console.error('Main window reference lost')
    else mainWindow.webContents.send(channel, ...args)
  },
  getPersistedTestState: async () => {
    const initialState: Partial<AppState> | undefined = process.env
      .PERSISTED_STATE_PATH
      ? JSON.parse(readFileSync(process.env.PERSISTED_STATE_PATH, 'utf8'))
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
        join(process.cwd(), 'icons', 'icon.png')
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
})

export type AppState = any
