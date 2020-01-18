import mocks from './mocks'
import helpers from './helpers'

const {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  openInBrowser,
  showMessageBox,
} =
  process.env.REACT_APP_SPECTRON || process.env.NODE_ENV === 'test'
    ? mocks
    : helpers

export {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  openInBrowser,
  showMessageBox,
}
