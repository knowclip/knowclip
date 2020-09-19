import helpers from './helpers'
import spectronMocks from '../../test/spectronMocks'

const { mocked, resetMocks } = spectronMocks('electron-helper', helpers)

const {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  showOpenDirectoriesDialog,
  openInBrowser,
  showMessageBox,
} =
  process.env.REACT_APP_SPECTRON || process.env.NODE_ENV === 'test'
    ? mocked
    : helpers

export {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  showOpenDirectoriesDialog,
  openInBrowser,
  showMessageBox,
}
