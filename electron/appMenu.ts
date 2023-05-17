import { BrowserWindow, app, Menu } from 'electron'

const SAVE_PROJECT = 'Save project'
const CLOSE_PROJECT = 'Close project'
const OPEN_PROJECT = 'Open project'

const template = (
  mainWindow: BrowserWindow,
  useDevTools: boolean
): (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] => [
  {
    label: 'Application',
    submenu: [
      {
        label: 'Settings',
        click: () =>
          mainWindow.webContents.send('message', 'show-settings-dialog'),
      },

      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit()
        },
      },
    ],
  },
  {
    label: 'File',
    id: 'File',
    submenu: [
      {
        id: SAVE_PROJECT,
        label: 'Save project',
        accelerator: 'CmdOrCtrl+S',
        enabled: false,
        click: () =>
          mainWindow.webContents.send('message', 'save-project-request'),
      },
      {
        id: CLOSE_PROJECT,
        label: 'Close project',
        enabled: false,
        click: () =>
          mainWindow.webContents.send('message', 'close-project-request'),
      },
      {
        id: OPEN_PROJECT,
        label: 'Open project',
        enabled: true,
        click: () => mainWindow.webContents.send('message', 'open-project'),
      },
    ],
  },

  {
    label: '&Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'CmdOrCtrl+Z',
        click: () => mainWindow.webContents.send('message', 'undo'),
      },
      {
        label: 'Redo',
        accelerator: 'CmdOrCtrl+Shift+Z',
        click: () => mainWindow.webContents.send('message', 'redo'),
      },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
    ],
  },

  {
    label: '&View',
    submenu: [
      { role: 'resetZoom' },
      { accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
      { accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
      { role: 'togglefullscreen' },
      { type: 'separator' },
      ...(useDevTools
        ? [
            {
              role: 'toggleDevTools' as const,
            },
          ]
        : []),
    ],
  },

  {
    label: '&Help',
    submenu: [
      {
        label: 'Check for Updates',
        click: () => {
          mainWindow.webContents.send('message', 'check-for-updates')
        },
      },
      {
        label: 'About Application',
        click: () =>
          mainWindow.webContents.send('message', 'show-about-dialog'),
      },
    ],
  },
]

export default function appMenu(
  mainWindow: BrowserWindow,
  useDevTools: boolean = false
) {
  return Menu.setApplicationMenu(
    Menu.buildFromTemplate(template(mainWindow, useDevTools))
  )
}

export function setAppMenuProjectSubmenuPermissions(projectOpened: boolean) {
  const menu = Menu.getApplicationMenu()
  const submenu = menu && menu.getMenuItemById('File').submenu
  if (!submenu) return

  submenu.getMenuItemById(SAVE_PROJECT).enabled = projectOpened
  submenu.getMenuItemById(CLOSE_PROJECT).enabled = projectOpened

  submenu.getMenuItemById(OPEN_PROJECT).enabled = !projectOpened
}
