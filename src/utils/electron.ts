import electron, { FileFilter, shell } from 'electron'

const {
  remote: { dialog, getCurrentWindow },
} = electron

const win = getCurrentWindow()
export const showSaveDialog = (
  name: string,
  extensions: Array<string>
): Promise<string | null> =>
  new Promise(async (res, rej) => {
    try {
      const { filePath } = await dialog.showSaveDialog(win, {
        filters: [{ name, extensions }],
      })
      return await res(filePath)
    } catch (err) {
      return await rej(err)
    }
  })

export const showOpenDialog = (
  filters: Array<FileFilter> = [],
  multiSelections = false
): Promise<Array<string> | null> =>
  new Promise(async (res, rej) => {
    try {
      const { filePaths } = await dialog.showOpenDialog(win, {
        properties: multiSelections
          ? ['openFile', 'multiSelections']
          : ['openFile'],
        filters,
      })
      return await res(filePaths && filePaths.length ? filePaths : null)
    } catch (err) {
      return await rej(err)
    }
  })

export const showOpenDirectoryDialog = (
  showHiddenFiles = true
): Promise<string | null> =>
  new Promise(async (res, rej) => {
    try {
      const { filePaths: directoryPaths } = await dialog.showOpenDialog(win, {
        properties: showHiddenFiles
          ? ['openDirectory', 'showHiddenFiles']
          : ['openDirectory'],
      })
      return await res(directoryPaths ? directoryPaths[0] : null)
    } catch (err) {
      return await rej(err)
    }
  })

export const openInBrowser = (
  e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
) => {
  e.preventDefault()
  shell.openExternal((e.target as HTMLAnchorElement).href)
}
