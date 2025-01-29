import type { TestDriver } from './driver/TestDriver'

type ModuleLike = { [name: string]: (...args: any) => any }

export default function getFunctionMockers<M extends ModuleLike>(
  moduleId: string
): (
  app: TestDriver,
  mocks: Partial<{
    [K in keyof M]: ReturnType<M[K]>[]
  }>
) => Promise<void> {
  const mocking = process.env.VITEST
  if (!mocking)
    return async (_app, _mocks) => {
      throw new Error(
        `Can't mock in production environment. chromedriver: "${process.env.VITEST}" node env: "${process.env.NODE_ENV}"`
      )
    }

  async function mockFunction<F extends keyof M>(
    app: TestDriver,
    functionName: F,
    returnValue: ReturnType<M[F]>
  ) {
    const serializedReturnValue = await serializeReturnValue(returnValue)
    const response = await app.webContentsSend(
      'mock-function',
      moduleId,
      functionName,
      serializedReturnValue
    )

    return response
  }

  async function mockFunctions(
    app: TestDriver,
    mocks: Partial<{ [K in keyof M]: ReturnType<M[K]>[] }>
  ) {
    const startupStatus = await app.startupStatus
    if (startupStatus.error) {
      console.error(startupStatus.error)
      throw new Error(
        `Can't mock functions because test driver failed to start: ${startupStatus.error}`
      )
    }

    for (const entry of Object.entries(mocks)) {
      const functionName: keyof M = entry[0] as any
      const returnValues: ReturnType<M[typeof functionName]>[] = entry[1] as any

      for (const returnValue of returnValues)
        await mockFunction(app, functionName, returnValue)
    }
  }

  return mockFunctions
}

const serializeReturnValue = async (returnValue: any) =>
  returnValue instanceof Promise
    ? {
        isPromise: true,
        value: await returnValue,
      }
    : { isPromise: false, value: returnValue }
