import { createTestDriver, TestDriver } from '../driver/TestDriver'
import chromedriver from 'chromedriver'
import { join } from 'path'

const electronPath = require('electron')

describe('integration test', () => {
  let app: TestDriver

  beforeAll(async () => {
    console.log('creating test driver')
    app = await createTestDriver({
      webdriverIoPath: (electronPath as unknown) as string,
      chromedriverPath: chromedriver.path,
      appDir: join(__dirname, '..', '..', '..'),
      chromeArgs: [
        'disable-extensions',
        ...(process.env.APPVEYOR ? ['no-sandbox'] : []),
      ],
    })
    console.log('creating test driver')
    const { result: ready } = await app.isReady
    console.log('HI!!!!')
    console.log('HI!!!!')
    console.log('HI!!!!')
    expect(ready).toBe(true)
  })

  afterAll(async () => {
    console.log('stopping app')
    await app.stop()
    console.log('done with test cleanup')
  })

  it('sets up ok', async () => {
    const body = await app.client.$('body')
    expect(await body.getText()).toContain('Knowclip')
  })
})
