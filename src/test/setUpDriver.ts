import electron from 'electron'
import { join } from 'path'
import { ClientWrapper } from './driver/ClientWrapper'
import { mkdirp, remove, existsSync, copy, writeFile } from 'fs-extra'
import tempy from 'tempy'
import { createTestDriver, TestDriver } from './driver/TestDriver'

export const TMP_DIRECTORY = join(process.cwd(), 'tmp-test')
export const ASSETS_DIRECTORY = join(__dirname, 'assets')
export const GENERATED_ASSETS_DIRECTORY = join(ASSETS_DIRECTORY, 'generated')
export const FIXTURES_DIRECTORY = join(__dirname, 'fixtures')

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

  // const app = new Application({
  //   chromeDriverArgs: ['--disable-extensions', '--debug'],
  //   waitTimeout: 10000, // until apkg generation/ffmpeg stuff is properly mocked
  //   webdriverOptions: { deprecationWarnings: false },
  //   path: (electron as unknown) as string,
  //   env: {
  //     NODE_ENV: 'test',
  //     REACT_APP_SPECTRON: Boolean(process.env.REACT_APP_SPECTRON),
  //     INTEGRATION_DEV: Boolean(process.env.INTEGRATION_DEV),
  //     ...(persistedStatePath
  //       ? { PERSISTED_STATE_PATH: persistedStatePath }
  //       : null),
  //   },
  //   args: [join(__dirname, '..', '..')],
  // })

  // thse ppl got headless working?
  // https://github.com/electron-userland/spectron/issues/323 ??
  const app = await createTestDriver({
    path: (electron as unknown) as string,
    chromeArgs: [
      'disable-extensions',
      'no-sandbox',
      // ...(process.env.APPVEYOR) ? ["no-sandbox"] : [],
    ], // ? does this actually correspond?
    // webdriverOptions: { deprecationWarnings: false },
    env: {
      NODE_ENV: 'test',
      REACT_APP_SPECTRON: String(Boolean(process.env.REACT_APP_SPECTRON)),
      INTEGRATION_DEV: String(Boolean(process.env.INTEGRATION_DEV)),
      ...(persistedStatePath
        ? { PERSISTED_STATE_PATH: persistedStatePath }
        : null),
    },
  })
  context.app = app

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

  // if (app && app.isRunning()) app.mainProcess.exit(0)

  context.app = null

  return null
}

async function copyFixtures() {
  if (existsSync(TMP_DIRECTORY)) await remove(TMP_DIRECTORY)
  await mkdirp(TMP_DIRECTORY)
  await copy(FIXTURES_DIRECTORY, TMP_DIRECTORY)
}
