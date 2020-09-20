import { ipcRenderer } from 'electron'

export type MessageToMain =
  | { type: 'isReady' }
  | { type: 'sayHi' }
  | { type: 'double'; args: [number] }
  | { type: 'asyncTriple'; args: [number] }
  | { type: 'log'; args: any[] }

export type MessageHandlerResult<M extends MessageToMain> = ReturnType<
  typeof MESSAGE_RESPONSES[M['type']]
>

export type MessageResponse<R> =
  | { result: R; error?: undefined }
  | { result?: undefined; error: { message: string; stack: any; name: string } }

type Awaited<R> = R extends PromiseLike<infer U> ? U : R

async function respond<M extends MessageToMain>(
  message: M
): Promise<Awaited<MessageHandlerResult<M>>> {
  const responseHandler = MESSAGE_RESPONSES[message.type]
  // @ts-ignore
  const result = responseHandler(...(message.args || []))
  // @ts-ignore
  return await result
}

export async function onMessage(
  message: MessageToMain
): Promise<MessageResponse<any>> {
  try {
    const responseHandler = MESSAGE_RESPONSES[message.type]
    if (!responseHandler)
      throw new Error(`Unknown message type: ${JSON.stringify(message)}`)

    const result = await respond(message)
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

export const MESSAGE_RESPONSES = {
  isReady: () => true,
  sayHi: () => 'hi there',
  double: (num: number) => num * 2,
  asyncTriple: async (num: number) => num * 3,
  log: (...args: any[]) => {
    console.log(...args)
  },
}
