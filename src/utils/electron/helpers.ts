import type {
  FileFilter,
  MessageBoxOptions,
  MessageBoxReturnValue,
} from 'electron'
import { shell } from 'preloaded/electron'
import { extname } from 'preloaded/path'
import { sendToMainProcess } from 'preloaded/sendToMainProcess'
import { pauseMedia } from '../media'
import type { MessageResponse } from '../../MessageToMain'

const ipcResult = <T>(messageResponse: MessageResponse<T>) => {
  if (messageResponse.error) {
    console.error(messageResponse.error)
    throw new Error('Problem reaching main process.')
  }

  return messageResponse.result
}

const showSaveDialog = (
  name: string,
  extensions: Array<string>
): Promise<string | null | undefined> =>
  new Promise(async (res, rej) => {
    pauseMedia()

    try {
      const saveDialog = await sendToMainProcess({
        type: 'showSaveDialog',
        args: [name, extensions],
      })
      const { filePath } = ipcResult(saveDialog)

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
      const openDialog = await sendToMainProcess({
        type: 'showOpenDialog',
        args: [filters, multiSelections],
      })
      const { filePaths } = ipcResult(openDialog)
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
      const openDirectoryDialog = await sendToMainProcess({
        type: 'showOpenDirectoryDialog',
        args: [showHiddenFiles],
      })
      const { filePaths: directoryPaths } = ipcResult(openDirectoryDialog)

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
      const openDirectoriesDialog = await sendToMainProcess({
        type: 'showOpenDirectoriesDialog',
        args: [showHiddenFiles],
      })
      const { filePaths: directoryPaths } = ipcResult(openDirectoriesDialog)
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
  options: Pick<
    MessageBoxOptions,
    | 'type'
    | 'title'
    | 'message'
    | 'checkboxChecked'
    | 'checkboxLabel'
    | 'buttons'
    | 'cancelId'
  >
) => Promise<MessageBoxReturnValue | null> = async (options) => {
  pauseMedia()
  const messageBox = await sendToMainProcess({
    type: 'showMessageBox',
    args: [options],
  })
  const result = ipcResult(messageBox)
  return result
}

const openExternal = (url: string) => shell.openExternal(url)

const helpers = {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  showOpenDirectoriesDialog,
  openInBrowser,
  showMessageBox,
  openExternal,
}

export default helpers
