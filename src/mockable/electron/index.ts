import helpers from './helpers'
import { setUpMocks } from 'setUpMocks'

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
