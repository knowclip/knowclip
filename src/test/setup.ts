import { Application, SpectronClient } from 'spectron'
import electron from 'electron'
import { join } from 'path'
import * as electronHelpers from '../utils/electron'
import { RawResult } from 'webdriverio'

export const _ = (idOrClassName: string) =>
  `#${idOrClassName}, .${idOrClassName}`

export type TestSetup = {
  app: Application
  client: SpectronClient
  $: SpectronClient['$']
  $$: (label: string) => RawResult<WebdriverIO.Element>[]
}

export async function setUpApp(
  context: {
    app: Application | null
  },
  mocks?: any
): Promise<TestSetup> {
  const app = new Application({
    chromeDriverArgs: ['--disable-extensions', '--debug'],
    webdriverOptions: { deprecationWarnings: false },
    path: (electron as unknown) as string,
    env: { NODE_ENV: 'test', SPECTRON: process.env.REACT_APP_SPECTRON },
    args: [join(__dirname, '..', '..'), '-r', join(__dirname, 'mocks.js')],
  })

  context.app = app

  await app.start()

  if (mocks) {
    await mockElectronHelpers(app, mocks)
  }

  return {
    app,
    client: app.client,
    $: (label: string) => app.client.$(_(label)),
    $$: (label: string) => app.client.$$(_(label)),
  }
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

export async function tearDownApp(context: {
  app: Application | null
}): Promise<null> {
  const { app } = context
  if (app) {
    app.stop()
  }

  if (app && app.isRunning()) app.mainProcess.exit(0)

  context.app = null

  return null
}
