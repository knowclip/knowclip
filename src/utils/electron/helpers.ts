import electron, {
  FileFilter,
  shell,
  MessageBoxOptions,
  MessageBoxReturnValue,
} from 'electron'

const showSaveDialog = (
  name: string,
  extensions: Array<string>
): Promise<string | null> =>
  new Promise(async (res, rej) => {
    try {
      const { filePath } = await electron.remote.dialog.showSaveDialog(
        electron.remote.getCurrentWindow(),
        {
          filters: [{ name, extensions }],
        }
      )
      return await res(filePath)
    } catch (err) {
      return await rej(err)
    }
  })

const showOpenDialog = (
  filters: Array<FileFilter> = [],
  multiSelections = false
): Promise<Array<string> | null> =>
  new Promise(async (res, rej) => {
    try {
      const { filePaths } = await electron.remote.dialog.showOpenDialog(
        electron.remote.getCurrentWindow(),
        {
          properties: multiSelections
            ? ['openFile', 'multiSelections']
            : ['openFile'],
          filters,
        }
      )
      return await res(filePaths && filePaths.length ? filePaths : null)
    } catch (err) {
      return await rej(err)
    }
  })

const showOpenDirectoryDialog = (
  showHiddenFiles = true
): Promise<string | null> =>
  new Promise(async (res, rej) => {
    try {
      const {
        filePaths: directoryPaths,
      } = await electron.remote.dialog.showOpenDialog(
        electron.remote.getCurrentWindow(),
        {
          properties: showHiddenFiles
            ? ['openDirectory', 'showHiddenFiles']
            : ['openDirectory'],
        }
      )
      return await res(directoryPaths ? directoryPaths[0] : null)
    } catch (err) {
      return await rej(err)
    }
  })

const openInBrowser = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
  e.preventDefault()
  shell.openExternal((e.target as HTMLAnchorElement).href)
}

const showMessageBox: (
  options: MessageBoxOptions
) => Promise<MessageBoxReturnValue | null> = options =>
  electron.remote.dialog.showMessageBox(
    electron.remote.getCurrentWindow(),
    options
  )

export default {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  openInBrowser,
  showMessageBox,
}
