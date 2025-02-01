import type { MainProcessIpcMessageHandlers } from './getMainProcessIpcMessageHandlers'
import { failure } from './utils/result'

export type MessageToMain<T extends MessageToMainType> = {
  type: T
  args: Parameters<MainProcessIpcMessageHandlers[T]>
}

export { MainProcessIpcMessageHandlers as MessageResponders }
export type MessageToMainType = keyof MainProcessIpcMessageHandlers

export type MessageHandlerResult<T extends MessageToMainType> = ReturnType<
  MainProcessIpcMessageHandlers[T]
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
