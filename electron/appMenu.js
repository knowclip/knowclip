const template = ({ app }, mainWindow, useDevTools) => [
  {
    label: 'Application',
    submenu: [
      {
        label: 'Settings',
        click: () => mainWindow.webContents.send('show-settings-dialog'),
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
        id: 'Save project',
        label: 'Save project',
        accelerator: 'CmdOrCtrl+S',
        enabled: false,
        click: () => mainWindow.webContents.send('save-project'),
      },
      {
        id: 'Close project',
        label: 'Close project',
        enabled: false,
        click: () => mainWindow.webContents.send('close-project'),
      },
      {
        id: 'Open project',
        label: 'Open project',
        enabled: true,
        click: () => mainWindow.webContents.send('open-project'),
      },
    ],
  },

  {
    label: '&Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectall' },
    ],
  },

  {
    label: '&View',
    submenu: [
      { role: 'resetzoom' },
      { accelerator: 'CmdOrCtrl+=', role: 'zoomin' },
      { accelerator: 'CmdOrCtrl+-', role: 'zoomout' },
      { role: 'togglefullscreen' },
      { type: 'separator' },
      ...(useDevTools
        ? [
            {
              role: 'toggledevtools',
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
          mainWindow.webContents.send('check-for-updates')
        },
      },
      {
        label: 'About Application',
        click: () => mainWindow.webContents.send('show-about-dialog'),
      },
    ],
  },
]

module.exports = (electron, { mainWindow }, useDevTools = false) => {
  const { Menu } = electron
  return Menu.setApplicationMenu(
    Menu.buildFromTemplate(template(electron, mainWindow, useDevTools))
  )
}
