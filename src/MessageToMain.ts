import { getMessageResponders } from './getMessageResponders'
import { failure } from './utils/result'

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

export function flatten<A extends any[], R>(
  fn: (...args: A) => Promise<MessageResponse<Result<R>>>
): (...args: A) => Promise<MessageResponse<R>> {
  return async (...args) => {
    const result = await fn(...args)
    if (result.error) {
      return failure(result.error)
    }
    return result.value
  }
}
