import electron from 'electron'
import { join } from 'path'
import { ClientWrapper } from './driver/ClientWrapper'
import {
  mkdirp,
  remove,
  existsSync,
  copy,
  writeFile,
  readdirSync,
} from 'fs-extra'
import * as tempy from 'tempy'
import { createTestDriver, TestDriver } from './driver/TestDriver'
import { beforeEach } from 'vitest'
import { promises } from 'fs'

const rootDir = join(process.cwd())

const TMP_DIRECTORY = join(rootDir, 'tmp-test')
export const SCREENSHOTS_DIRECTORY = join(rootDir, 'screenshots')
export const ASSETS_DIRECTORY = join(__dirname, 'assets')
export const GENERATED_ASSETS_DIRECTORY = join(ASSETS_DIRECTORY, 'generated')
export const FIXTURES_DIRECTORY = join(__dirname, 'fixtures')

function getChromedriverPath() {
  const binFolder = join(
    rootDir,
    'node_modules',
    'electron-chromedriver',
    'bin'
  )
  const filesInBinFolder = readdirSync(binFolder)
  const electronFile = filesInBinFolder.find((file) =>
    file.toLowerCase().includes('chromedriver')
  )
  if (!electronFile) {
    throw new Error(`chromedriver not found in ${binFolder}`)
  }
  const chromedriverPath = join(binFolder, electronFile)
  console.log(`chromedriver path: ${chromedriverPath}`)
  if (!existsSync(chromedriverPath)) {
    throw new Error(`chromedriver not found at ${chromedriverPath}`)
  }
  return chromedriverPath
}

export interface IntegrationTestContext {
  testId: string
  /** path to a temporary directory, corresponding to the testId.
   * data from fixtures is copied here before each test.
   */
  temporaryDirectory: string
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
  const context: IntegrationTestContext = {
    testId,
    temporaryDirectory: join(TMP_DIRECTORY, testId),
    setup: null,
    get client() {
      return this.setup!.client
    },
    get app() {
      return this.setup!.app
    },
  }

  beforeEach((ctx) => {
    ;(ctx as any).saveScreenshot = async (filepath: string) => {
      await context.client._driver.client.saveScreenshot(filepath)
    }
  })

  return context
}

/** mutates context */
export async function startApp(
  context: IntegrationTestContext,
  chromedriverPort?: number,
  persistedState?: Partial<AppState>
): Promise<{
  app: TestDriver
  client: ClientWrapper
  logPersistedData: () => Promise<void>
}> {
  await copyFixtures(context.temporaryDirectory)

  const persistedStatePath = persistedState ? tempy.temporaryFile() : null
  if (persistedStatePath) {
    await writeFile(persistedStatePath, JSON.stringify(persistedState))
  }

  const app = await createTestDriver({
    // logLevel: 'warn',
    chromedriverPath: getChromedriverPath(),
    webdriverIoPath:
      process.platform === 'win32'
        ? join(rootDir, 'node_modules', 'electron', 'dist', 'electron.exe')
        : (electron as unknown as string),
    appDir: rootDir,
    chromeArgs: [
      'enable-logging',
      ...(process.env.VITE_INTEGRATION_DEV ? [] : ['disable-extensions']),
      ...(process.env.VITE_INTEGRATION_DEV ? ['verbose'] : []),
      '--no-sandbox',
    ],
    env: {
      VITEST: 'true',
      TEST_ID: context.testId,
      PERSISTED_STATE_PATH: persistedStatePath || undefined,
      NODE_ENV: 'integration',
      DISPLAY: process.env.DISPLAY,
      VITE_INTEGRATION_DEV: process.env.VITE_INTEGRATION_DEV,
    },
    port: chromedriverPort,
  })
  const setup = {
    app,
    client: new ClientWrapper(app),
    logPersistedData: async () => {
      await app.webContentsSend('log-persisted-data', context.testId, {
        ASSETS_DIRECTORY,
        GENERATED_ASSETS_DIRECTORY,
      })
    },
  }
  context.setup = setup

  const startupStatus = await app.startupStatus
  if (startupStatus.error) {
    console.error(startupStatus.error)
    throw new Error(`Problem starting test driver: ${startupStatus.error}`)
  }

  await app.webContentsSend('start-test', context.testId)

  return setup
}

export async function stopApp(context: IntegrationTestContext): Promise<null> {
  const app = context.setup?.app

  if (!app) console.error('No app instance found, not closing app')

  const browserLogs = await app?.client.getLogs('browser')
  if (browserLogs?.length)
    await promises.writeFile(
      join(process.cwd(), 'logs', context.testId + '.browser.log'),
      JSON.stringify(browserLogs, null, 2),
      'utf8'
    )

  if (process.env.VITE_INTEGRATION_DEV && !process.env.BUILDING_FIXTURES) {
    return null
  }

  if (app) {
    await app.webContentsSend('end-test')

    await app.stop()
  }

  context.setup = null

  return null
}

async function copyFixtures(temporaryDirectory: string) {
  if (existsSync(temporaryDirectory)) await remove(temporaryDirectory)
  await mkdirp(temporaryDirectory)
  await mkdirp(SCREENSHOTS_DIRECTORY)
  await copy(FIXTURES_DIRECTORY, temporaryDirectory)
}
