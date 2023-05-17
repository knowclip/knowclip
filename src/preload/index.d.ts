import { ElectronApi } from '.'

declare global {
  interface Window {
    electronApi: ElectronApi
  }
}
