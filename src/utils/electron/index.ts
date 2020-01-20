import mocks from './mocks'
import helpers from './helpers'
import setUpMocks from '../../test/setUpMocks'

const { mocked, resetMocks } = setUpMocks('electron-helper', helpers)

const {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
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
  openInBrowser,
  showMessageBox,
}
