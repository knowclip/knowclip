const electron = require('electron')
const path = require('path')
const url = require('url')
const { app, ipcMain } = electron
const { isPackaged } = app
const { BrowserWindow } = electron
const setUpMenu = require('./electron/appMenu')

const installDevtools = require('./electron/devtools')

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
  // Create the browser window.
  context.mainWindow =
    context.mainWindow ||
    new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        webSecurity: isPackaged,
        nodeIntegration: true,
        devTools: process.env.NODE_ENV !== 'test',
      },
    })

  // and load the index.html of the app.
  context.mainWindow.loadURL(
    process.env.NODE_ENV === 'test' || isPackaged
      ? url.format({
          pathname: path.join(__dirname, 'build', 'index.html'),
          protocol: 'file',
          slashes: 'true',
        })
      : 'http://localhost:3000'
  )

  if (!isPackaged && process.env.NODE_ENV !== test) await installDevtools()

  context.mainWindow.on('close', e => {
    if (context.mainWindow) {
      e.preventDefault()
      context.mainWindow.webContents.send('app-close')
    }
  })

  // Emitted when the window is closed.
  context.mainWindow.on('closed', function() {
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

  setUpMenu(app, context)
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
