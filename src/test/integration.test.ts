// A simple test to verify a visible window is opened with a title
import { Application } from 'spectron'
import { join } from 'path'
import electron from 'electron'

jest.setTimeout(60000)

describe('App runs', () => {
  let app: Application | undefined

  it('runs', async () => {
    app =
      app ||
      new Application({
        chromeDriverArgs: ['--disable-extensions', '--debug'],
        path: (electron as unknown) as string,
        env: { NODE_ENV: 'test' },
        args: [join(__dirname, '../..')],
      })
    await app.start()

    const isVisible = await app.browserWindow.isVisible()
    expect(isVisible).toBe(true)

    expect(await app.browserWindow.getTitle()).toBe('Knowclip')

    await app.stop()
  })

  afterAll(() => {
    if (app && app.isRunning()) {
      app.mainProcess.exit(0)
    }
  })
})
