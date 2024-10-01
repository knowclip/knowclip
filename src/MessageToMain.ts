import type { MessageResponders } from './getMessageResponders'

export type { MessageResponders }

export type MessageToMain<T extends MessageToMainType> = {
  type: T
  args: Parameters<MessageResponders[T]>
}

export type MessageToMainType = keyof MessageResponders

export type MessageHandlerResult<T extends MessageToMainType> = ReturnType<
  MessageResponders[T]
>

export type MessageResponse<R> = Result<R>

export function flatten<A extends any[], R>(
  fn: (...args: A) => Promise<MessageResponse<Result<R>>>
): (...args: A) => Promise<MessageResponse<R>> {
  return async (...args) => {
    const result = await fn(...args)
    if (result.errors) {
      return { errors: result.errors }
    }
    return result.value
  }
}
