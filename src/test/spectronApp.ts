import { Application } from 'spectron'
import electron from 'electron'
import { join } from 'path'
import { ClientWrapper } from './driver/ClientWrapper'
import { mkdirp, remove, existsSync, copy } from 'fs-extra'

export const TMP_DIRECTORY = join(process.cwd(), 'tmp-test')
export const ASSETS_DIRECTORY = join(__dirname, 'assets')
export const GENERATED_ASSETS_DIRECTORY = join(ASSETS_DIRECTORY, 'generated')
export const FIXTURES_DIRECTORY = join(__dirname, 'fixtures')

export type TestSetup = {
  app: Application
  client: ClientWrapper
}

export async function startApp(
  context: {
    app: Application | null
  },
  testId: string,
  persistedState?: Partial<AppState>
): Promise<TestSetup> {
  await copyFixtures()

  const app = new Application({
    chromeDriverArgs: ['--disable-extensions', '--debug'],
    webdriverOptions: { deprecationWarnings: false },
    path: (electron as unknown) as string,
    env: {
      NODE_ENV: 'test',
      REACT_APP_SPECTRON: Boolean(process.env.REACT_APP_SPECTRON),
      INTEGRATION_DEV: Boolean(process.env.INTEGRATION_DEV),
    },
    args: [join(__dirname, '..', '..')],
  })
  context.app = app

  await app.start()

  if (persistedState) {
    for (const [key, value] of Object.entries(persistedState))
      await app.client.localStorage('POST', {
        key,
        value: JSON.stringify(value),
      })
    await app.client.refresh()
  }

  const setup = {
    app,
    client: new ClientWrapper(app.client),
  }
  return setup
}

export async function stopApp(context: {
  app: Application | null
}): Promise<null> {
  if (process.env.INTEGRATION_DEV) {
    return null
  }

  const { app } = context
  if (app) {
    await app.stop()
  }

  if (app && app.isRunning()) app.mainProcess.exit(0)

  context.app = null

  return null
}
async function copyFixtures() {
  if (existsSync(TMP_DIRECTORY)) await remove(TMP_DIRECTORY)
  await mkdirp(TMP_DIRECTORY)
  await copy(FIXTURES_DIRECTORY, TMP_DIRECTORY)
}
