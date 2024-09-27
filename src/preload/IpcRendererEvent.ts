export class IpcRendererEvent<T> extends Event {
  electronIpcRendererEvent: Electron.IpcRendererEvent
  payload: T

  constructor(
    electronIpcRendererEvent: Electron.IpcRendererEvent,
    type: string,
    payload: T
  ) {
    super(`ipc:${type}`)
    this.electronIpcRendererEvent = electronIpcRendererEvent
    this.payload = payload
  }
}
