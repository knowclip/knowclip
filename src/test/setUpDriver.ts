import electron from 'electron'
import { join } from 'path'
import { ClientWrapper } from './driver/ClientWrapper'
import { mkdirp, remove, existsSync, copy, writeFile } from 'fs-extra'
import tempy from 'tempy'
import { createTestDriver, TestDriver } from './driver/TestDriver'

// https://github.com/prisma/prisma/issues/8558
// @ts-ignore
global.setImmediate = global.setTimeout

const rootDir = join(process.cwd())

export const TMP_DIRECTORY = join(rootDir, 'tmp-test')
export const SCREENSHOTS_DIRECTORY = join(rootDir, 'screenshots')
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

export type IntegrationTestContext = {
  testId: string
  setup: {
    app: TestDriver
    client: ClientWrapper
    logPersistedData: () => Promise<void>
  } | null
  /** for easy access within `test` blocks. will be null before setup is complete. */
  client: ClientWrapper
  /** for easy access within `test` blocks. will be null before setup is complete. */
  app: TestDriver
}

export function initTestContext(testId: string): IntegrationTestContext {
  return {
    testId,
    setup: null,
    get client() {
      return this.setup!.client as ClientWrapper
    },
    get app() {
      return this.setup!.app as TestDriver
    },
  }
}

/** mutates context */
export async function startApp(
  context: IntegrationTestContext,
  persistedState?: Partial<AppState>
): Promise<{
  app: TestDriver
  client: ClientWrapper
  logPersistedData: () => Promise<void>
}> {
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
        : (electron as unknown as string),
    appDir: rootDir,
    chromeArgs: [
      ...(process.env.INTEGRATION_DEV ? [] : 'disable-extensions'),
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
  context.setup = setup

  if (!(await app.isReady)) {
    throw new Error('Problem starting test driver')
  }

  await app.webContentsSend('start-test', context.testId)

  return setup
}

export async function stopApp(context: IntegrationTestContext): Promise<null> {
  const app = context.setup?.app

  if (!app) console.error('No app instance found, not closing app')

  if (process.env.INTEGRATION_DEV && !process.env.BUILDING_FIXTURES) {
    return null
  }

  if (app) {
    await app.webContentsSend('end-test')

    await app.stop()
  }

  context.setup = null

  return null
}

async function copyFixtures() {
  if (existsSync(TMP_DIRECTORY)) await remove(TMP_DIRECTORY)
  await mkdirp(TMP_DIRECTORY)
  await mkdirp(SCREENSHOTS_DIRECTORY)
  await copy(FIXTURES_DIRECTORY, TMP_DIRECTORY)
}
