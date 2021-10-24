import { dragMouse, clickAt } from './runEvents'
import { Element } from 'webdriverio'
import { ElementWrapper, element } from './ElementWrapper'
import { TestDriver } from './TestDriver'

export { dragMouse, clickAt }

export const getSelector = (testLabel: string) => `#${testLabel}, .${testLabel}`

export class ClientWrapper {
  /** The original client. To be avoided except in ClientWrapper methods,
   * as the API and typings are outdated, and will hopefully be upgraded soon
   * when Spectron moves to WebdriverIO v5.
   *
   * The WebDriverIO v4 API docs can be found here: http://v4.webdriver.io/api.html. */
  _driver: TestDriver

  constructor(client: TestDriver) {
    this._driver = client
  }

  async firstElement(selector: string): Promise<ElementWrapper> {
    try {
      const result = await this._driver.client.$(selector)
      await result.waitForExist()
      return await element(this._driver, result, selector)
    } catch (err) {
      throw new Error(`Could not find element "${selector}": ${err}`)
    }
  }
  async firstElement_(testLabel: string): Promise<ElementWrapper> {
    return await this.firstElement(getSelector(testLabel))
  }

  async elements(selector: string, count?: number): Promise<ElementWrapper[]> {
    if (typeof count === 'number' && count <= 0)
      throw new Error('Count must be at least 1')
    let elementsSoFar: Element[] | undefined
    try {
      if (count)
        await this._driver.client.waitUntil(
          async () => {
            const elements: Element[] = await this._driver.client.$$(selector)
            elementsSoFar = elements
            return elements.length === count
          },
          { timeout: 10000 }
        )
      else elementsSoFar = await this._driver.client.$$(selector)

      if (!elementsSoFar) throw new Error('Elements were null')

      return elementsSoFar.map((v) => element(this._driver, v, selector))
    } catch (err) {
      throw new Error(
        `Could not find ${count} elements with selector "${selector}". Instead found ${
          elementsSoFar ? elementsSoFar.length : 'none'
        } before: ${err}`
      )
    }
  }
  async elements_(
    testLabel: string,
    count?: number
  ): Promise<ElementWrapper[]> {
    return await this.elements(getSelector(testLabel), count)
  }

  async setFieldValue(selector: string, value: string) {
    const element = await this.firstElement(selector)
    await element.setFieldValue(value)
  }
  async setFieldValue_(testLabel: string, value: string) {
    await this.setFieldValue(getSelector(testLabel), value)
  }

  async clickElement(selector: string) {
    const element = await this.firstElement(selector)
    await element.click()
  }
  async clickElement_(testLabel: string) {
    await this.clickElement(getSelector(testLabel))
  }

  async doubleClickElement(selector: string) {
    const element = await this.firstElement(selector)
    await element.doubleClick()
  }
  async doubleClickElement_(testLabel: string) {
    await this.doubleClickElement(getSelector(testLabel))
  }

  async waitUntilPresent(selector: string, ms?: number) {
    try {
      return await (await this._driver.client.$(selector)).waitForExist({
        timeout: ms,
      })
    } catch (err) {
      throw new Error(`Element "${selector}" would not appear: ${err}`)
    }
  }
  async waitUntilPresent_(testLabel: string, ms?: number) {
    return await this.waitUntilPresent(getSelector(testLabel), ms)
  }

  async waitUntilGone(selector: string) {
    try {
      return await this._driver.client.waitUntil(
        async () => {
          try {
            const elements = await this._driver.client.$$(selector)
            if (!elements.length) return true
            const element = await this._driver.client.$(selector)
            const displayed = await element.isDisplayedInViewport()

            return !displayed
          } catch (err) {
            console.error(err)
            if (err instanceof Error && err.message.includes('no such element'))
              return true
            else
              throw new Error(`Problem detecting element "${selector}": ${err}`)
          }
        },
        { timeout: 10000, interval: 200 }
      )
    } catch (err) {
      throw new Error(`Element "${selector}" would not disappear: ${err}`)
    }
  }
  async waitUntilGone_(testLabel: string) {
    return await this.waitUntilGone(getSelector(testLabel))
  }

  async getAttribute(selector: string, attributeName: string) {
    const element = await this.firstElement(selector)

    return await element.getAttribute(attributeName)
  }
  async getAttribute_(testLabel: string, attributeName: string) {
    return await this.getAttribute(getSelector(testLabel), attributeName)
  }

  async waitForText(selector: string, text: string) {
    const element = await this.firstElement(selector)
    await element.waitForText(text)
  }
  async waitForText_(selector: string, text: string) {
    return await this.waitForText(getSelector(selector), text)
  }

  async getText(selector: string) {
    const element = await this.firstElement(selector)
    return await element.getText()
  }
  async getText_(testLabel: string) {
    return await this.getText(getSelector(testLabel))
  }

  async elementWithText(selector: string, text: string) {
    await this.waitForText('body', text)
    const elements = await this.elements(selector)
    const elementsText = await Promise.all(elements.map((e) => e.getText()))
    const elementWithText = elements.find((e, i) =>
      elementsText[i].includes(text)
    )

    if (!elementWithText)
      throw new Error(
        `No elements matching "${selector}" contain text "${text}"`
      )
    return elementWithText
  }

  elementWithText_(testLabel: string, text: string) {
    return this.elementWithText(getSelector(testLabel), text)
  }

  async waitForVisible(selector: string) {
    try {
      return await this._driver.client.waitUntil(
        async () => {
          const element = await this.firstElement(selector)
          return await element.isVisible()
        },
        { timeout: 10000 }
      )
    } catch (err) {
      throw new Error(`Element "${selector}" would not show: ${err}`)
    }
  }
  async waitForVisible_(selector: string) {
    return await this.waitForVisible(getSelector(selector))
  }

  async waitForHidden(selector: string) {
    try {
      return await this._driver.client.waitUntil(
        async () => {
          const element = await this.firstElement(selector)
          return !(await element.isVisible())
        },
        { timeout: 10000 }
      )
    } catch (err) {
      throw new Error(`Element "${selector}" would not hide: ${err}`)
    }
  }
  async waitForHidden_(testLabel: string) {
    return await this.waitForHidden(getSelector(testLabel))
  }

  /** possible values listed here: https://w3c.github.io/webdriver/#keyboard-actions **/
  async pressKeys(normalizedKeyValues: string[]) {
    await this._driver.client.keys(normalizedKeyValues)
  }

  async waitUntil(condition: () => Promise<boolean>) {
    try {
      await this._driver.client.waitUntil(condition, {
        timeout: 10000,
        interval: 200,
      })
    } catch (err) {
      throw new Error(
        `Wait condition was not met: ${condition.toString()}: ${err}`
      )
    }
  }

  async clickAtOffset(selector: string, { x, y }: { x: number; y: number }) {
    try {
      const el = await this.firstElement(selector)
      return el.clickAtOffset({ x, y })
    } catch (err) {
      throw new Error(
        `Could not click element "${selector}" at offset ${x}, ${y}: ${err}`
      )
    }
  }
  async clickAtOffset_(testLabel: string, { x, y }: { x: number; y: number }) {
    return await this.clickAtOffset(getSelector(testLabel), { x, y })
  }

  async moveTo(selector: string, offset: { x: number; y: number }) {
    const el = await this.firstElement(selector)
    return await el.moveTo(offset)
  }
  async moveTo_(testLabel: string, offset: { x: number; y: number }) {
    return await this.moveTo(getSelector(testLabel), offset)
  }
}
