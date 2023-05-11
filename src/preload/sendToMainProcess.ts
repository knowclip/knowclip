import { ipcRenderer } from 'electron'
import type {
  MessageToMainType,
  MessageToMain,
  MessageResponse,
  MessageHandlerResult,
} from '../getMessageResponders'

export async function sendToMainProcess<T extends MessageToMainType>(
  message: MessageToMain<T>
): Promise<MessageResponse<Awaited<MessageHandlerResult<T>>>> {
  return await ipcRenderer.invoke('message', message)
}
