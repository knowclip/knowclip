import helpers from './helpers'
import spectronMocks from '../../test/spectronMocks'

const {
  mocked,
  resetMocks,
  mockFunctions: mockElectronHelpers,
} = spectronMocks('electron-helper', helpers)

const showSaveDialog: typeof helpers['showSaveDialog'] = async (...args) => {
  return mocked.showSaveDialog ? await mocked.showSaveDialog(...args) : null
}
const showOpenDialog: typeof helpers['showOpenDialog'] = async (...args) =>
  mocked.showOpenDialog ? await mocked.showOpenDialog(...args) : null
const showOpenDirectoryDialog: typeof helpers['showOpenDirectoryDialog'] = async (
  ...args
) =>
  mocked.showOpenDirectoryDialog
    ? await mocked.showOpenDirectoryDialog(...args)
    : null
const openInBrowser: typeof helpers['openInBrowser'] = (...args) =>
  mocked.openInBrowser ? mocked.openInBrowser(...args) : null

const showMessageBox: typeof helpers['showMessageBox'] = async (...args) =>
  mocked.showMessageBox ? await mocked.showMessageBox(...args) : null

export { mocked, resetMocks, mockElectronHelpers }

export default {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  openInBrowser,
  showMessageBox,
}
