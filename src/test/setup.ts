import { Application, SpectronClient } from 'spectron'
import electron from 'electron'
import { join } from 'path'
import * as electronHelpers from '../utils/electron'
import { RawResult } from 'webdriverio'

export const TMP_DIRECTORY = join(process.cwd(), 'tmp-test')
export const MEDIA_DIRECTORY = join(__dirname, 'media')

export const _ = (idOrClassName: string) =>
  `#${idOrClassName}, .${idOrClassName}`

export type TestSetup = {
  app: Application
  client: SpectronClient
  $_: SpectronClient['$']
  $$_: (label: string) => RawResult<WebdriverIO.Element>[]
}

export async function startApp(
  context: {
    app: Application | null
  },
  mocks?: any
): Promise<TestSetup> {
  const app = new Application({
    chromeDriverArgs: ['--disable-extensions', '--debug'],
    webdriverOptions: { deprecationWarnings: false },
    path: (electron as unknown) as string,
    env: {
      NODE_ENV: 'test',
      SPECTRON: process.env.REACT_APP_SPECTRON,
      INTEGRATION_DEV: process.env.INTEGRATION_DEV,
    },
    args: [join(__dirname, '..', '..')],
  })
  context.app = app

  await app.start()

  if (mocks) {
    await mockElectronHelpers(app, mocks)
  }

  const setup = {
    app,
    client: app.client,
    $_: (label: string) => app.client.$(_(label)),
    $$_: (label: string) => app.client.$$(_(label)),
  }
  return setup
}

export async function stopApp(context: {
  app: Application | null
}): Promise<null> {
  const { app } = context
  if (app) {
    await app.stop()
  }

  if (app && app.isRunning()) app.mainProcess.exit(0)

  context.app = null

  return null
}

async function mockElectronHelper<F extends keyof typeof electronHelpers>(
  app: Application,
  functionName: F,
  returnValue: ReturnType<typeof electronHelpers[F]>
) {
  return app.webContents.send('mock', functionName, await returnValue)
}

export async function mockElectronHelpers(
  app: Application,
  mocks: Partial<
    {
      [K in keyof typeof electronHelpers]: ReturnType<typeof electronHelpers[K]>
    }
  >
) {
  await app.client.waitUntilWindowLoaded()
  for (const entry of Object.entries(mocks)) {
    const functionName: keyof typeof electronHelpers = entry[0] as any
    const returnValue: ReturnType<typeof electronHelpers[typeof functionName]> =
      entry[1]

    await mockElectronHelper(app, functionName, returnValue)
  }
}
