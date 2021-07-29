import electron from 'electron'
import { join } from 'path'
import { ClientWrapper } from './driver/ClientWrapper'
import { mkdirp, remove, existsSync, copy, writeFile } from 'fs-extra'
import tempy from 'tempy'
import { createTestDriver, TestDriver } from './driver/TestDriver'

const rootDir = join(process.cwd())

export const TMP_DIRECTORY = join(rootDir, 'tmp-test')
export const ASSETS_DIRECTORY = join(__dirname, 'assets')
export const GENERATED_ASSETS_DIRECTORY = join(ASSETS_DIRECTORY, 'generated')
export const FIXTURES_DIRECTORY = join(__dirname, 'fixtures')

// https://github.com/giggio/node-chromedriver/blob/main/bin/chromedriver
const chromedriverPath = require(join(
  rootDir,
  'node_modules',
  'chromedriver',
  'lib',
  'chromedriver'
)).path

export type TestSetup = {
  app: TestDriver
  client: ClientWrapper
  logPersistedData: () => Promise<void>
}

export async function startApp(
  context: {
    app: TestDriver | null
    testId: string
  },
  persistedState?: Partial<AppState>
): Promise<TestSetup> {
  await copyFixtures()

  const persistedStatePath = persistedState ? tempy.file() : null
  if (persistedStatePath) {
    await writeFile(persistedStatePath, JSON.stringify(persistedState))
  }

  const app = await createTestDriver({
    chromedriverPath: chromedriverPath,
    webdriverIoPath:
      process.platform === 'win32'
        ? join(rootDir, 'node_modules', 'electron', 'dist', 'electron.exe')
        : ((electron as unknown) as string),
    appDir: rootDir,
    chromeArgs: [
      'disable-extensions',
      ...(process.env.INTEGRATION_DEV ? ['verbose'] : []),
      ...(process.env.APPVEYOR ? ['no-sandbox'] : []),
    ],
    env: {
      PUBLIC_URL: process.env.PUBLIC_URL,
      NODE_ENV: 'test',
      REACT_APP_CHROMEDRIVER: Boolean(process.env.REACT_APP_CHROMEDRIVER)
        ? 'true'
        : undefined,
      INTEGRATION_DEV: Boolean(process.env.INTEGRATION_DEV)
        ? 'true'
        : undefined,
      ...(persistedStatePath
        ? { PERSISTED_STATE_PATH: persistedStatePath }
        : null),
    },
  })
  context.app = app
  if (!(await app.isReady)) {
    throw new Error('Problem starting test driver')
  }

  await app.webContentsSend('start-test', context.testId)

  const setup = {
    app,
    client: new ClientWrapper(app),
    logPersistedData: async () => {
      await app.webContentsSend('log-persisted-data', context.testId, {
        ASSETS_DIRECTORY,
        GENERATED_ASSETS_DIRECTORY,
        TMP_DIRECTORY,
      })
    },
  }
  return setup
}

export async function stopApp(context: {
  app: TestDriver | null
  testId: string
}): Promise<null> {
  const { app } = context
  if (process.env.INTEGRATION_DEV && !process.env.BUILDING_FIXTURES) {
    return null
  }

  if (app) {
    await app.webContentsSend('end-test')

    await app.stop()
  }

  context.app = null

  return null
}

async function copyFixtures() {
  if (existsSync(TMP_DIRECTORY)) await remove(TMP_DIRECTORY)
  await mkdirp(TMP_DIRECTORY)
  await copy(FIXTURES_DIRECTORY, TMP_DIRECTORY)
}

export async function testBlock<T>(name: string, cb: () => Promise<T>): Promise<T> {
  try {
    process.stdout.write('\n     ' + name)

    const result = await cb()

    process.stdout.write(' ✅  \n')

    return result
  } catch (err) {
    process.stdout.write(' ❗️ \n')

    const errName = String(err.name || err.constructor)
    process.stdout.write(
      errName + ' ' + String(err.message) + '\nFailure at: ' + name
    )
    throw new TestBlockError(name, err.message, err.stack)
  } finally {
    process.stdout.write('\n')
  }
}

class TestBlockError extends Error {
  constructor(
    blockName: string,
    message: string,
    stack: typeof Error.prototype.stack
  ) {
    super(`Failure at ${JSON.stringify(blockName)}: ${message}`)
    this.stack = stack
  }
}
