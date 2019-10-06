import electron, { FileFilter } from 'electron'

const {
  remote: { dialog, getCurrentWindow },
} = electron

const win = getCurrentWindow()
export const showSaveDialog = (
  name: string,
  extensions: Array<string>
): Promise<string | null> =>
  new Promise((res, rej) => {
    try {
      dialog.showSaveDialog(
        win,
        { filters: [{ name, extensions }] },
        filename => {
          res(filename)
        }
      )
    } catch (err) {
      rej(err)
    }
  })

export const showOpenDialog = (
  filters: Array<FileFilter> = [],
  multiSelections = false
): Promise<Array<string> | null> =>
  new Promise((res, rej) => {
    try {
      dialog.showOpenDialog(
        win,
        {
          properties: multiSelections
            ? ['openFile', 'multiSelections']
            : ['openFile'],
          filters,
        },
        filePaths => res(filePaths)
      )
    } catch (err) {
      rej(err)
    }
  })

export const showOpenDirectoryDialog = (showHiddenFiles = true) =>
  // ): Promise<Array<string | null> | null> =>
  new Promise((res, rej) => {
    try {
      dialog.showOpenDialog(
        win,
        {
          properties: showHiddenFiles
            ? ['openDirectory', 'showHiddenFiles']
            : ['openDirectory'],
        },
        directoryPaths => res(directoryPaths ? directoryPaths[0] : null)
      )
    } catch (err) {
      rej(err)
    }
  })
