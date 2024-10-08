import * as vitest from 'vitest'
import { SCREENSHOTS_DIRECTORY } from './setUpDriver'
import filenamify from 'filenamify'
import moment from 'moment'
import { join } from 'path'

export { expect } from 'vitest'

export function test(name: string, fn: () => Promise<void>): void {
  vitest.test(name, async (ctx) => {
    vitest.onTestFailed(async () => {
      try {
        const filenameSegments = ctx.task.file?.name.split('/')
        const testNameSegments = vitest.expect
          .getState()
          .currentTestName?.split(' > ')
        const screenshotFilepath = join(
          SCREENSHOTS_DIRECTORY,
          filenamify(
            moment().toISOString() +
              '___' +
              filenameSegments?.[filenameSegments.length - 1] +
              '_' +
              testNameSegments?.[testNameSegments.length - 1]
          ) + '.png'
        )

        await (ctx as any).saveScreenshot(screenshotFilepath)
      } catch (screenshotError) {
        console.error(screenshotError)
        throw screenshotError
      }
    })

    await fn()
  })
}
