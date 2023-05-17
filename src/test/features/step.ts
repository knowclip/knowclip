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
    await runTest(context as any)
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
