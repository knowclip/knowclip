import { BrowserWindow , screen, app, ipcMain, protocol } from 'electron'
import * as path from 'path'
import * as url from 'url'
import setUpMenu from './appMenu'
import installDevtools from './devtools'
import { ROOT_DIRECTORY } from './root'
import { getStartUrl, WINDOW_START_DIMENSIONS } from './window'
import { handleMessages } from '../src/messages'

const { isPackaged } = app

const Sentry = require('@sentry/electron')

Sentry.init({
  dsn: 'https://bbdc0ddd503c41eea9ad656b5481202c@sentry.io/1881735',
})

const INTEGRATION_DEV = JSON.parse(process.env.INTEGRATION_DEV || 'false')

const useDevtools = process.env.NODE_ENV === 'test' ? INTEGRATION_DEV : true

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

const context: { mainWindow: BrowserWindow | null } = { mainWindow: null }

// have to do it this to access ffmpeg path from within webpack bundle
const ffmpegStaticBasePath = require('ffmpeg-static').path
const ffprobeStaticBasePath = require('ffprobe-static').path
const getFfmpegStaticPath = (basePath: string) =>
  basePath.replace('app.asar', 'app.asar.unpacked') // won't do anything in development

// @ts-ignore
global.ffmpegpath = getFfmpegStaticPath(ffmpegStaticBasePath)
// @ts-ignore
global.ffprobepath = getFfmpegStaticPath(ffprobeStaticBasePath)

async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    width: Math.min(WINDOW_START_DIMENSIONS.width, width),
    height: Math.min(WINDOW_START_DIMENSIONS.height, height),
    minWidth: 740,
    minHeight: 570,
    webPreferences: {
      webSecurity: isPackaged,
      nodeIntegration: true,
      devTools: useDevtools,
      enableRemoteModule: true,
    },
  })

  const splash =
    process.env.NODE_ENV !== 'test'
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

  // and load the index.html of the app.
  mainWindow.loadURL(
    isPackaged || (process.env.NODE_ENV === 'test' && !INTEGRATION_DEV)
      ? getStartUrl()
      : 'http://localhost:3000'
  )

  if (useDevtools) await installDevtools()

  mainWindow.on('close', e => {
    if (context.mainWindow) {
      e.preventDefault()

      // properly, should make sure SOME kind of response went through
      // so if there is no response at all,
      // user won't have to force-quit.

      mainWindow.webContents.send('app-close')
    }
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    context.mainWindow = null
  })
}

app.whenReady().then(() => {
  // https://github.com/electron/electron/issues/23757#issuecomment-640146333
  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURI(request.url.replace('file:///', ''));
    callback(pathname);
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()

  setUpMenu(context.mainWindow as BrowserWindow, true)
  handleMessages(context.mainWindow as BrowserWindow)
})

app.on('will-quit', () => {
  // // Unregister a shortcut.
  // electron.globalShortcut.unregister('CommandOrControl+K')
  // // Unregister all shortcuts.
  // electron.globalShortcut.unregisterAll()
})

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (context.mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('closed', function() {
  context.mainWindow = null
  app.quit()
})


