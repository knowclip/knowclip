import electron from 'electron'

export function setAppMenuProjectSubmenuPermissions(projectOpened: boolean) {
  const menu = electron.remote.Menu.getApplicationMenu()
  const submenu = menu && menu.getMenuItemById('File').submenu
  if (!submenu) return

  submenu.getMenuItemById('Save project').enabled = projectOpened
  submenu.getMenuItemById('Close project').enabled = projectOpened

  submenu.getMenuItemById('Open project').enabled = !projectOpened
}
