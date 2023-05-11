import electron from 'electron'

export const shell = {
  openExternal: (url: string) => electron.shell.openExternal(url),
}
