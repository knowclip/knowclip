import { BrowserWindow, ipcMain, ipcRenderer } from 'electron'

export type MessageToMain<T extends MessageToMainType> = {
  type: T
  args: Parameters<MessageResponders[T]>
}

type MessageResponders = ReturnType<typeof getMessageResponders>
export type MessageToMainType = keyof MessageResponders

export type MessageHandlerResult<T extends MessageToMainType> = ReturnType<
  MessageResponders[T]
>

export type MessageResponse<R> =
  | { result: R; error?: undefined }
  | { result?: undefined; error: { message: string; stack: any; name: string } }

type Awaited<R> = R extends PromiseLike<infer U> ? U : R

async function respond<T extends MessageToMainType>(
  messageHandlers: MessageResponders,
  message: MessageToMain<T>
): Promise<Awaited<MessageHandlerResult<T>>> {
  const responseHandler = messageHandlers[message.type]
  // @ts-ignore
  const result = responseHandler(...(message.args || []))
  // @ts-ignore
  return await result
}

export function handleMessages(mainWindow: BrowserWindow) {
  const messageHandlers = getMessageResponders(mainWindow)

  async function onMessage<T extends MessageToMainType>(
    message: MessageToMain<T>
  ): Promise<MessageResponse<any>> {
    try {
      const responseHandler = messageHandlers[message.type]
      if (!responseHandler)
        throw new Error(`Unknown message type: ${JSON.stringify(message)}`)

      const result = await respond(messageHandlers, message)
      return { result: await result }
    } catch (rawError) {
      const error = {
        message: rawError.message,
        stack: rawError.stack,
        name: rawError.name,
      }
      return { error }
    }
  }

  ipcMain.handle('message', (event, message) => onMessage(message))

  mainWindow.on('closed', () => {
    ipcMain.removeHandler('message')
  })
}

export async function sendToMainProcess<T extends MessageToMainType>(
  message: MessageToMain<T>
): Promise<MessageHandlerResult<T>> {
  return await ipcRenderer.invoke('message', message)
}

const getMessageResponders = (mainWindow: BrowserWindow) => ({
  isReady: () => true,
  log: (...args: any[]) => {
    console.log(...args)
  },
  sendToRenderer: (channel: string, args: string[]) => {
    if (!mainWindow) console.error('Main window reference lost')
    else mainWindow.webContents.send(channel, ...args)
  },
  sendInputEvent: (
    inputEvent:
      | Electron.MouseInputEvent
      | Electron.MouseWheelInputEvent
      | Electron.KeyboardInputEvent
  ) => {
    if (!mainWindow) console.error('Main window reference lost')
    else mainWindow.webContents.sendInputEvent(inputEvent)
  },
})
