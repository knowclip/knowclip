import { ipcRenderer } from 'electron'
import { Application } from 'spectron'
import { promises } from 'fs'
import { join } from 'path'
import moment from 'moment'

type ModuleLike = { [name: string]: (...args: any) => any }

type MockedModule<M extends ModuleLike> = { -readonly [K in keyof M]: M[K] }

export default function setUpMocks<M extends ModuleLike>(
  moduleId: string,
  actualModule: MockedModule<M>
): {
  mocked: MockedModule<M>
  resetMocks: () => void
  mockFunctions: (
    app: Application,
    mocks: Partial<{ [K in keyof M]: ReturnType<M[K]>[] }>
  ) => Promise<void>
  logMocks: (app: Application) => Promise<void>
} {
  const now = moment.utc().format()
  const logFilePath = join(process.cwd(), `${moduleId}-mocks-${now}.log`)
  const mockMessageName = 'mock-' + moduleId
  const logMessageName = 'log-mocks-' + moduleId
  const mocked: MockedModule<M> = { ...actualModule }
  const logged = {} as { [K in keyof M]: ReturnType<M[K]>[] }

  const returnValues = {} as { [K in keyof M]: ReturnType<M[K]>[] }
  for (const functionName in actualModule) {
    logged[functionName] = []

    returnValues[functionName] = []

    // @ts-ignore
    mocked[functionName] = (...args) => {
      const mockedReturnValue = returnValues[functionName].shift()
      if (mockedReturnValue) {
        logged[functionName].push(mockedReturnValue)
        return mockedReturnValue
      }

      const actualReturnValue = actualModule[functionName](...args)

      console.log(`${functionName} was not mocked`, {
        args,
        returnValue: actualReturnValue,
      })

      logged[functionName].push(actualReturnValue)

      promises.writeFile(logFilePath, JSON.stringify(logged, null, 2))

      return actualReturnValue
    }
  }

  const resetMocks = () => {
    for (const k in returnValues) returnValues[k] = []
  }

  window.document.addEventListener('DOMContentLoaded', () => {
    ipcRenderer.on(mockMessageName, (event, functionName, newReturnValue) => {
      returnValues[functionName].push(deserializeReturnValue(newReturnValue))
    })

    ipcRenderer.on('reset-mocks', () => {
      resetMocks()
    })

    ipcRenderer.on(logMessageName, () => {
      promises.writeFile(logFilePath, JSON.stringify(logged, null, 2))
    })
  })

  async function mockFunction<F extends keyof M>(
    app: Application,
    functionName: F,
    returnValue: ReturnType<M[F]>
  ) {
    return app.webContents.send(
      mockMessageName,
      functionName,
      await serializeReturnValue(returnValue)
    )
  }

  async function mockFunctions(
    app: Application,
    mocks: Partial<{ [K in keyof M]: ReturnType<M[K]>[] }>
  ) {
    await app.client.waitUntilWindowLoaded()
    for (const entry of Object.entries(mocks)) {
      const functionName: keyof M = entry[0] as any
      const returnValues: ReturnType<M[typeof functionName]>[] = entry[1] as any

      for (const returnValue of returnValues)
        await mockFunction(app, functionName, returnValue)
    }
  }

  async function logMocks(app: Application) {
    app.webContents.send(logMessageName)
    await null
  }

  return { mocked, resetMocks, mockFunctions, logMocks }
}

const serializeReturnValue = async (returnValue: any) =>
  returnValue instanceof Promise
    ? {
        isPromise: true,
        value: await returnValue,
      }
    : { isPromise: false, value: returnValue }

const deserializeReturnValue = ({
  isPromise,
  value,
}: {
  isPromise: boolean
  value: any
}) => (isPromise ? Promise.resolve(value) : value)
