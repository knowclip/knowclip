export type MessageToMain =
  | { type: 'isReady' }
  | { type: 'sayHi' }
  | { type: 'double', args: [number] }
  | { type: 'asyncTriple', args: [number] }

export type MessageResponse<R> =
  | { result: R, error?: undefined }
  | { result?: undefined, error: { message: string, stack: any, name: string }}

export async function onMessage(message: MessageToMain): Promise<MessageResponse<any>> {
  try {
    if (!MESSAGE_RESPONSES[message.type])
      throw new Error(`Unknown message type: ${JSON.stringify(message)}`)
    const result = 'args' in message
      ? MESSAGE_RESPONSES[message.type](...message.args)
      : MESSAGE_RESPONSES[message.type]()
    return { result: await result }
  } catch (rawError) {
    const error = {
      message: rawError.message,
      stack: rawError.stack,
      name: rawError.name
    }
    return { error }
  }
}

export const MESSAGE_RESPONSES  = {
  isReady: () => true,
  sayHi: () => 'hi there',
  double: (num: number) => num * 2,
  asyncTriple: async (num: number) => num * 3,
}
