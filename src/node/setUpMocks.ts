type ModuleLike = { [name: string]: (...args: any) => any }

type MockedModule<M extends ModuleLike> = { -readonly [K in keyof M]: M[K] }
const mocking = process.env.NODE_ENV === 'integration'

export function setUpMocks<M extends ModuleLike>(
  moduleId: string,
  actualModule: MockedModule<M>
): MockedModule<M> {
  if (!mocking) return actualModule

  const currentTestId = window.electronApi.env.TEST_ID

  const mockState = {
    logged: {} as { [K in keyof M]: ReturnType<M[K]>[] },
    returnValues: {} as { [K in keyof M]: ReturnType<M[K]>[] },
  }
  const { logged, returnValues } = mockState
  window.electronApi.mockedModules[moduleId] = mockState

  const mockedModule = {} as MockedModule<M>

  for (const functionName in actualModule) {
    logged[functionName] = []
    returnValues[functionName] = []

    // @ts-expect-error arguments are going to match anyway
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    mockedModule[functionName] = (...args) => {
      if (returnValues[functionName].length) {
        const mockedReturnValue = returnValues[functionName].shift()!
        logged[functionName].push(mockedReturnValue)
        return mockedReturnValue
      }

      const actualReturnValue = actualModule[functionName](...args)

      console.log(`${moduleId}#${functionName} was not mocked`, {
        args,
        returnValue: actualReturnValue,
      })

      logged[functionName].push(actualReturnValue)

      window.electronApi.writeMocksLog(
        currentTestId || 'NO_TEST_ID',
        moduleId,
        logged
      )

      return actualReturnValue
    }
  }

  return mockedModule
}
