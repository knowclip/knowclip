import { BrowserWindow, screen, app, ipcMain } from 'electron'
import * as path from 'path'
import * as url from 'url'
import * as Sentry from '@sentry/electron/main'
import { Conf } from 'electron-conf/main'
import setUpMenu from './appMenu'
import installDevtools from './devtools'
import { ROOT_DIRECTORY } from './root'
import { handleMessages } from '../src/messages'
import { interceptLogs } from './interceptLogs'
import { SENTRY_DSN_URL } from './SENTRY_DSN_URL'
import { startLocalFileServer } from './localFileServer/setup'

const { isPackaged } = app
const isTesting = process.env.VITEST
if (!isPackaged && process.platform === 'darwin')
  // to suppress warnings on mac intel for electron 32.1.2
  app.disableHardwareAcceleration()

console.log('main process VITEST', process.env.VITEST)
if (!isTesting) {
  const conf = new Conf()

  conf.registerRendererListener()
  console.log('conf registered')
}

if (isTesting) interceptLogs(process.env.TEST_ID || 'NO_TEST_ID')

Sentry.init({
  dsn: SENTRY_DSN_URL,
})

const shouldInstallExtensions = Boolean(
  process.env.NODE_ENV === 'development' ||
    process.env.VITE_INTEGRATION_DEV ||
    (process.env.NODE_ENV === 'production' &&
      !JSON.parse(process.env.RELEASE_BUILD || 'false'))
)

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

const context: {
  mainWindow: BrowserWindow | null
  knowclipServerIp: string | null
  knowclipServerPort: string | null
} = { mainWindow: null, knowclipServerIp: null, knowclipServerPort: null }

async function createWindow({
  knowclipServerIp,
  knowclipServerPort,
}: {
  knowclipServerIp: string
  knowclipServerPort: string
}) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    width: isTesting ? 1027 : width,
    height: isTesting ? 768 : height,
    minWidth: 740,
    minHeight: 570,
    webPreferences: {
      additionalArguments: [
        `--kc-ip=${knowclipServerIp}`,
        `--kc-port=${knowclipServerPort}`,
      ],
      webSecurity: isPackaged,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: shouldInstallExtensions,
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
    },
  })

  const splash = !isTesting
    ? new BrowserWindow({
        show: false,
        width: 512,
        height: 512,
        frame: false,
        backgroundColor: '#DDDDDD',
      })
    : null

  if (splash) {
    splash.loadURL(
      url.format({
        pathname: path.join(ROOT_DIRECTORY, 'icons', 'icon.png'),
        protocol: 'file',
        slashes: 'true' as unknown as boolean,
      })
    )

    splash.once('ready-to-show', () => {
      splash.show()
    })
  }

  context.mainWindow = mainWindow

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (splash) splash.close()
  })

  mainWindow.on('close', (e) => {
    if (context.mainWindow) {
      e.preventDefault()

      // properly, should make sure SOME kind of response went through
      // so if there is no response at all,
      // user won't have to force-quit.

      mainWindow.webContents.send('message', 'app-close')
    }
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    context.mainWindow = null
  })

  // and load the index.html of the app.
  isPackaged || isTesting
    ? mainWindow.loadFile(
        path.resolve(ROOT_DIRECTORY, 'out', 'renderer', 'index.html')
      )
    : mainWindow.loadURL('http://localhost:5173')
}

app.whenReady().then(async () => {
  const { knowclipServerIp, knowclipServerPort, filePathsRegistry } =
    await startLocalFileServer()

  context.knowclipServerIp = knowclipServerIp
  context.knowclipServerPort = String(knowclipServerPort)

  if (shouldInstallExtensions) {
    try {
      await installDevtools({
        redux: true,
        // webdriverio mistakenly connects to some context opened up by react devtools
        react: !isTesting,
      })
      console.log('devtools installed')
    } catch (e) {
      console.log('devtools failed to install')
      console.log(e)
      throw e
    }
  }

  console.log(`Creating window`)
  await createWindow({
    knowclipServerIp,
    knowclipServerPort: String(knowclipServerPort),
  })

  console.log(`Setting up menu`)
  setUpMenu(context.mainWindow as BrowserWindow, true)
  console.log(`Menu set up`)
  handleMessages(
    context.mainWindow as BrowserWindow,
    filePathsRegistry,
    process.env.PERSISTED_STATE_PATH
  )
})

app.on('will-quit', () => {
  // // Unregister a shortcut.
  // electron.globalShortcut.unregister('CommandOrControl+K')
  // // Unregister all shortcuts.
  // electron.globalShortcut.unregisterAll()
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (context.mainWindow === null) {
    if (!context.knowclipServerIp || !context.knowclipServerPort) {
      throw new Error(
        'Something went wrong when starting the media server. Please restart the app.'
      )
    }
    createWindow({
      knowclipServerIp: context.knowclipServerIp,
      knowclipServerPort: context.knowclipServerPort,
    })
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('closed', function () {
  context.mainWindow = null
  app.quit()
})
