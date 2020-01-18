import helpers from './helpers'
import { ipcRenderer } from 'electron'

type Mocks = Partial<
  { -readonly [K in keyof typeof helpers]: typeof helpers[K] }
>

export const mocked: Mocks = {}
export const resetMocks = () => {
  for (const k in mocked) delete mocked[k as keyof typeof helpers]
}

window.document.addEventListener('DOMContentLoaded', () => {
  let args: { [functionName: string]: string[] } = {}

  ipcRenderer.on('mock', (event, functionName, returnValue) => {
    const returnValues = (args[functionName] = args[functionName] || [])
    returnValues.push(returnValue)
    // @ts-ignore
    mocked[functionName] = () => {
      if (returnValues.length) return returnValues.shift()

      // @ts-ignore
      return helpers[functionName]
    }
  })

  ipcRenderer.on('reset-mocks', () => {
    args = {}
    resetMocks()
  })
})

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

export default {
  showSaveDialog,
  showOpenDialog,
  showOpenDirectoryDialog,
  openInBrowser,
  showMessageBox,
}
