import { ipcRenderer } from 'electron'
import type {
  MessageToMainType,
  MessageToMain,
  MessageResponse,
  MessageHandlerResult,
} from '../MessageToMain'

export async function sendToMainProcess<T extends MessageToMainType>(
  message: MessageToMain<T>
): Promise<MessageResponse<Awaited<MessageHandlerResult<T>>>> {
  return await ipcRenderer.invoke('message', message)
}
