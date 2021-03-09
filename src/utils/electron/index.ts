import helpers from './helpers'
import spectronMocks from '../../test/spectronMocks'

const { module: mocked, resetMocks: _resetMocks } = spectronMocks(
  'electron-helper',
  helpers
)

const {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  showOpenDirectoriesDialog,
  openInBrowser,
  showMessageBox,
  openExternal,
} = mocked

export {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  showOpenDirectoriesDialog,
  openInBrowser,
  showMessageBox,
  openExternal,
}
