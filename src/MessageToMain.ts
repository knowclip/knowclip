import { getMessageResponders } from './getMessageResponders'

export type MessageToMain<T extends MessageToMainType> = {
  type: T
  args: Parameters<MessageResponders[T]>
}

export type MessageResponders = ReturnType<typeof getMessageResponders>
export type MessageToMainType = keyof MessageResponders

export type MessageHandlerResult<T extends MessageToMainType> = ReturnType<
  MessageResponders[T]
>

export type MessageResponse<
  R,
  E = { name?: string; stack?: string; message: string }
> = Result<R, E>
