const { Menu } = require('electron')

const template = (app, { mainWindow }) => [
  {
    label: 'Application',
    submenu: [
      {
        label: 'Settings',
        click: () => mainWindow.webContents.send('show-settings-dialog'),
      },
      {
        label: 'About Application',
        click: () => mainWindow.webContents.send('show-about-dialog'),
      },
      {
        label: 'Show developer tools',
        accelerator: 'CmdOrCtrl+K',
        click: () => mainWindow.webContents.openDevTools(),
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
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:',
      },
    ],
  },
]

module.exports = (app, mainWindow) =>
  Menu.setApplicationMenu(Menu.buildFromTemplate(template(app, mainWindow)))
