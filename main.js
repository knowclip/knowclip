const electron = require('electron')
const path = require('path')
const url = require('url')
const { app, ipcMain, autoUpdater } = electron
const { isPackaged } = app
const { BrowserWindow } = electron
const setUpMenu = require('./electron/appMenu')

const INTEGRATION_DEV = JSON.parse(process.env.INTEGRATION_DEV || 'false')

const installDevtools = require('./electron/devtools')
const useDevtools = Boolean(
  process.env.NODE_ENV === 'test' ? INTEGRATION_DEV : !isPackaged
)

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

const context = { mainWindow: null }

// have to do it this to access ffmpeg path from within webpack bundle
const ffmpegStaticBasePath = require('ffmpeg-static').path
const ffprobeStaticBasePath = require('ffprobe-static').path
const getFfmpegStaticPath = basePath =>
  basePath.replace('app.asar', 'app.asar.unpacked') // won't do anything in development

global.ffmpegpath = getFfmpegStaticPath(ffmpegStaticBasePath)
global.ffprobepath = getFfmpegStaticPath(ffprobeStaticBasePath)

async function createWindow() {
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    show: false,
    width: Math.min(1027, width),
    height: Math.min(768, height),
    minWidth: 740,
    minHeight: 570,
    webPreferences: {
      webSecurity: isPackaged,
      nodeIntegration: true,
      devTools: useDevtools,
    },
  })

  const splash = new BrowserWindow({
    show: false,
    width: 512,
    height: 512,
    frame: false,
    backgroundColor: '#DDDDDD',
  })

  splash.loadURL(
    url.format({
      pathname: path.join(__dirname, 'icons', 'icon.png'),
      protocol: 'file',
      slashes: 'true',
    })
  )

  if (process.env.NODE_ENV !== 'test')
    splash.once('ready-to-show', () => {
      splash.show()
    })

  context.mainWindow = mainWindow

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    splash.close()
  })

  // and load the index.html of the app.
  mainWindow.loadURL(
    isPackaged || (process.env.NODE_ENV === 'test' && !INTEGRATION_DEV)
      ? url.format({
          pathname: path.join(__dirname, 'build', 'index.html'),
          protocol: 'file',
          slashes: 'true',
        })
      : 'http://localhost:3000'
  )

  if (useDevtools) await installDevtools()

  mainWindow.on('close', e => {
    if (context.mainWindow) {
      e.preventDefault()
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()

  setUpMenu(electron, context, useDevtools)
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
