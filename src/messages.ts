import { BrowserWindow, ipcMain } from 'electron'
import { getMessageResponders } from './getMessageResponders'
import {
  MessageHandlerResult,
  MessageResponders,
  MessageResponse,
  MessageToMain,
  MessageToMainType,
} from './MessageToMain'

async function respond<T extends MessageToMainType>(
  messageHandlers: MessageResponders,
  message: MessageToMain<T>
): Promise<Awaited<MessageHandlerResult<T>>> {
  const responseHandler = messageHandlers[message.type]
  // @ts-expect-error arguments guaranteed elsewhere
  const result = responseHandler(...(message.args || []))
  // @ts-expect-error arguments guaranteed elsewhere
  return await result
}

export function handleMessages(
  mainWindow: BrowserWindow,
  ffmpegPaths: { ffmpeg: string; ffprobe: string },
  persistedStatePath?: string
) {
  const messageHandlers = getMessageResponders(
    mainWindow,
    ffmpegPaths,
    persistedStatePath
  )

  async function onMessage<T extends MessageToMainType>(
    message: MessageToMain<T>
  ): Promise<MessageResponse<any>> {
    try {
      const responseHandler = messageHandlers[message.type]
      if (!responseHandler)
        throw new Error(`Unknown message type: ${JSON.stringify(message)}`)

      const result = await respond(messageHandlers, message)
      return { value: await result }
    } catch (rawError) {
      const error = {
        message:
          rawError instanceof Error
            ? rawError.message
            : 'Non-error thrown: ' + String(rawError),
        stack: rawError instanceof Error ? rawError.stack : undefined,
        name: rawError instanceof Error ? rawError.name : undefined,
      }
      return { error }
    }
  }

  ipcMain.handle('message', (event, message) => onMessage(message))

  mainWindow.on('closed', () => {
    ipcMain.removeHandler('message')
  })
}
