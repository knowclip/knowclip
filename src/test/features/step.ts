import filenamify from 'filenamify'
import moment from 'moment'
import { join } from 'path'
import { SCREENSHOTS_DIRECTORY, IntegrationTestContext } from '../setUpDriver'
import { expect, describe } from 'vitest'

type TestStep = {
  description: string
  runTest: (context: IntegrationTestContext) => Promise<any>
}

export const step = (
  description: string,
  runTest: (context: IntegrationTestContext) => Promise<any>
): TestStep => ({
  description,
  runTest: async (context: IntegrationTestContext) => {
    try {
      await runTest(context as any)
    } catch (error) {
      try {
        const screenshotFilepath = join(
          SCREENSHOTS_DIRECTORY,
          filenamify(
            moment().toISOString() + '___' + expect.getState().currentTestName
          ) + '.png'
        )
        console.log(`Saving screenshot to: ${screenshotFilepath}`)

        await context.setup?.client._driver.client.saveScreenshot(
          screenshotFilepath
        )
        if (!context.setup)
          console.error(
            'Could not save screenshot, currently running app not found'
          )
      } catch (screenshotError) {
        console.error(screenshotError)
      }
      throw error
    }
  },
})

export const runAll = (
  testSteps: TestStep[],
  context: IntegrationTestContext
) => {
  testSteps.forEach(({ description, runTest }) => {
    describe(description, async () => {
      try {
        await runTest(context)
      } catch (err) {
        try {
          console.log('Logging markup from failed test:')
          const source =
            await context.setup?.client._driver.client.getPageSource()
          console.log(source)

          console.log('Logging persisted data from failed test:')
          await context.setup?.logPersistedData()
        } catch (err) {
          console.error(`Could not log info for failed test: ${err}`)
        }

        throw err
      }
    })
  })
}
