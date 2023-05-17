import helpers from './helpers'
import { setUpMocks } from 'preloaded/setUpMocks'

const {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  showOpenDirectoriesDialog,
  openInBrowser,
  showMessageBox,
  openExternal,
} = setUpMocks('electron-helper', helpers)

export {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  showOpenDirectoriesDialog,
  openInBrowser,
  showMessageBox,
  openExternal,
}
