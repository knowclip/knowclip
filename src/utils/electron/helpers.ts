import electron, {
  FileFilter,
  shell,
  MessageBoxOptions,
  MessageBoxReturnValue,
} from 'electron'
import { extname } from 'path'
import { pauseMedia } from '../../epicsDependencies'

const showSaveDialog = (
  name: string,
  extensions: Array<string>
): Promise<string | null> =>
  new Promise(async (res, rej) => {
    pauseMedia()

    try {
      const { filePath } = await electron.remote.dialog.showSaveDialog(
        electron.remote.getCurrentWindow(),
        {
          filters: [{ name, extensions }],
        }
      )

      if (!filePath) return await res(filePath)

      const extension = extname(filePath).replace(/^\./, '')
      const withExtension =
        !extensions.length ||
        extensions.some((ext) => ext.toLowerCase() === extension.toLowerCase())
          ? filePath
          : filePath + '.' + extensions[0]
      return await res(withExtension)
    } catch (err) {
      return await rej(err)
    }
  })

const showOpenDialog = (
  filters: Array<FileFilter> = [],
  multiSelections = false
): Promise<Array<string> | null> =>
  new Promise(async (res, rej) => {
    pauseMedia()

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
      return await res(filePaths?.length ? filePaths : null)
    } catch (err) {
      return await rej(err)
    }
  })

const showOpenDirectoryDialog = (
  showHiddenFiles = true
): Promise<string | null> =>
  new Promise(async (res, rej) => {
    pauseMedia()

    try {
      const properties = [
        'openDirectory' as const,
        ...(showHiddenFiles ? (['showHiddenFiles'] as const) : []),
      ]
      const {
        filePaths: directoryPaths,
      } = await electron.remote.dialog.showOpenDialog(
        electron.remote.getCurrentWindow(),
        {
          properties,
        }
      )
      return await res(directoryPaths ? directoryPaths[0] : null)
    } catch (err) {
      return await rej(err)
    }
  })
const showOpenDirectoriesDialog = (
  showHiddenFiles = true
): Promise<string[] | null> =>
  new Promise(async (res, rej) => {
    pauseMedia()

    try {
      const properties = [
        'openDirectory' as const,
        'multiSelections' as const,
        ...(showHiddenFiles ? (['showHiddenFiles'] as const) : []),
      ]
      const {
        filePaths: directoryPaths,
      } = await electron.remote.dialog.showOpenDialog(
        electron.remote.getCurrentWindow(),
        {
          properties,
        }
      )
      return await res(directoryPaths?.length ? directoryPaths : null)
    } catch (err) {
      return await rej(err)
    }
  })

const openInBrowser = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
  pauseMedia()
  e.preventDefault()
  shell.openExternal((e.target as HTMLAnchorElement).href)
}

const showMessageBox: (
  options: MessageBoxOptions
) => Promise<MessageBoxReturnValue | null> = (options) => {
  pauseMedia()
  return electron.remote.dialog.showMessageBox(
    electron.remote.getCurrentWindow(),
    options
  )
}
export default {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  showOpenDirectoriesDialog,
  openInBrowser,
  showMessageBox,
}
