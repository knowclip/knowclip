import { WaitForOptions, WaitUntilOptions } from 'webdriverio'
import { TestDriver } from './TestDriver'

/** A wrapper for `WebDriverIO.Client` method results
 * for when the `ClientWrapper` methods can't be called directly, e.g.
 * when targeting specific elements queried via `ClientWrapper#elements`.
 */
export interface ElementWrapper {
  selector: string
  setFieldValue: (value: string) => Promise<void>
  click: () => Promise<void>
  clickAtOffset: (opts: { x: number; y: number }) => Promise<void>
  getText: () => Promise<string>
  waitForText: (text: string, opts?: Partial<WaitForOptions>) => Promise<void>
  doubleClick: () => Promise<void>
  isClickable: () => Promise<boolean>
  isVisible: () => Promise<boolean>
  isVisibleOrDisplayed: () => Promise<boolean>
  isExisting: () => Promise<boolean>
  isSelected: () => Promise<boolean>
  getAttribute: (attributeName: string) => Promise<string | null>
  moveTo: (opts?: { x: number; y: number }) => Promise<void>
  findDescendant: (descendantSelector: string) => Promise<ElementWrapper | null>
}

export const wrapElement = (
  driver: TestDriver,
  element: WebdriverIO.Element,
  selector: string
): ElementWrapper => {
  const client = driver.client

  const getText = async () => {
    try {
      const result = await element.getText()

      if (typeof result !== 'string') {
        console.error(result, JSON.stringify(result))
        throw new Error(
          'Could not get text, instead got ' +
            (result && JSON.stringify(result as any))
        )
      }

      return result
    } catch (err) {
      console.error('Could not get text from element:', selector, err)
      throw err
    }
  }

  return {
    selector,
    setFieldValue: async (value: string) => {
      await element.setValue(value)
    },
    click: async () => {
      try {
        await element.click()
      } catch (err) {
        throw new Error(`Could not click element "${selector}": ${err}`)
      }
    },
    doubleClick: async () => {
      try {
        await element.doubleClick()
      } catch (err) {
        throw new Error(`Could not double-click element "${selector}": ${err}`)
      }
    },
    getText,
    waitForText: async (text: string, opts?: Partial<WaitUntilOptions>) => {
      let found: string | null = null
      try {
        await client.waitUntil(async () => {
          found = await getText()
          return Boolean(found) && found.includes(text)
        }, opts)
      } catch (err) {
        throw new Error(
          typeof found === 'string'
            ? `Selector "${selector}" received not "${text}", but "${found}", and then there was a problem: ${err}`
            : `Could not get text from "${selector}: ${err}`
        )
      }
    },
    isClickable: async () => {
      try {
        return await element.isClickable()
      } catch (err) {
        throw Error(`Could not get clickable status of "${selector}": ${err}`)
      }
    },
    isVisible: async () => {
      try {
        return await element.isDisplayedInViewport()
      } catch (err) {
        throw Error(`Could not get displayed status of "${selector}": ${err}`)
      }
    },
    isVisibleOrDisplayed: async () => {
      try {
        return await element.isDisplayed()
      } catch (err) {
        throw Error(`Could not get displayed status of "${selector}": ${err}`)
      }
    },
    isExisting: async () => {
      try {
        return await element.isExisting()
      } catch (err) {
        throw Error(`Could not get displayed status of "${selector}": ${err}`)
      }
    },
    getAttribute: async (attributeName: string) => {
      try {
        return element.getAttribute(attributeName)
      } catch (err) {
        throw new Error(
          `Could not get ${attributeName} attribute of "${selector}": ${err}`
        )
      }
    },
    isSelected: async () => {
      return await element.isSelected()
    },
    clickAtOffset: async ({ x, y }: { x: number; y: number }) => {
      try {
        await element.click({ x, y })
      } catch (err) {
        throw new Error(
          `Could not click "${selector}" at offset ${x} ${y}: ${err}`
        )
      }
    },
    moveTo: async (offset?: { x: number; y: number }) => {
      try {
        await element.moveTo(
          offset
            ? {
                xOffset: offset.x,
                yOffset: offset.y,
              }
            : undefined
        )
      } catch (err) {
        throw new Error(
          offset
            ? `Could not move to "${selector}" at offset ${offset.x} ${offset.y}: ${err}`
            : `Could not move to "${selector}": ${err}`
        )
      }
    },
    findDescendant: async (descendantSelector: string) => {
      const rawElement = await element.findElement(
        'css selector',
        descendantSelector
      )
      if (rawElement)
        return wrapElement(driver, element, `${selector} ${descendantSelector}`)

      return null
    },
  }
}

export { wrapElement as element }
