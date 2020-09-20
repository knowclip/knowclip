import { BrowserWindow, ipcMain, ipcRenderer, remote } from 'electron'

export type MessageToMain =
  | { type: 'isReady' }
  | { type: 'sayHi' }
  | { type: 'double'; args: [number] }
  | { type: 'asyncTriple'; args: [number] }
  | { type: 'log'; args: any[] }
  | { type: 'sendToRenderer'; args: [string, any[]] }

export type MessageHandlerResult<M extends MessageToMain> = ReturnType<
  ReturnType<typeof getMessageResponders>[M['type']]
>

export type MessageResponse<R> =
  | { result: R; error?: undefined }
  | { result?: undefined; error: { message: string; stack: any; name: string } }

type Awaited<R> = R extends PromiseLike<infer U> ? U : R

async function respond<M extends MessageToMain>(
  messageHandlers: ReturnType<typeof getMessageResponders>,
  message: M
): Promise<Awaited<MessageHandlerResult<M>>> {
  const responseHandler = messageHandlers[message.type]
  // @ts-ignore
  const result = responseHandler(...(message.args || []))
  // @ts-ignore
  return await result
}

export function handleMessages(mainWindow: BrowserWindow) {
  const messageHandlers = getMessageResponders(mainWindow)

  async function onMessage(
    message: MessageToMain
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

export async function sendToMainProcess<M extends MessageToMain>(
  message: M
): Promise<MessageHandlerResult<M>> {
  return await ipcRenderer.invoke('message', message)
}

// export const handleMessage(message: MessageToMain) {
//   switch (message.type) {

//   }
//   isReady: () => true,
//   sayHi: () => 'hi there',
//   double: (num: number) => num * 2,
//   asyncTriple: async (num: number) => num * 3,
//   log: (args: string[]) => {
//     console.log(...args)
//   }
// }

const getMessageResponders = (mainWindow: BrowserWindow) => ({
  isReady: () => true,
  sayHi: () => 'hi there',
  double: (num: number) => num * 2,
  asyncTriple: async (num: number) => num * 3,
  log: (...args: any[]) => {
    console.log(...args)
  },
  sendToRenderer: (channel: string, args: any[]) => {
    if (!mainWindow) console.error('No focused window')
    else mainWindow.webContents.send(channel, ...args)
  },
})
