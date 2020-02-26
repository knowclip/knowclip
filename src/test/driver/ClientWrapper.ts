import { SpectronClient } from 'spectron'
import { dragMouse, clickAt } from './runEvents'
import { RawResult, Element } from 'webdriverio'
import { ElementWrapper, element } from './ElementWrapper'

export { dragMouse, clickAt }

export const getSelector = (testLabel: string) => `#${testLabel}, .${testLabel}`

export class ClientWrapper {
  /** The original client. To be avoided except in ClientWrapper methods,
   * as the API and typings are outdated, and will hopefully be upgraded soon
   * when Spectron moves to WebdriverIO v5.
   *
   * The WebDriverIO v4 API docs can be found here: http://v4.webdriver.io/api.html. */
  _client: SpectronClient

  constructor(client: SpectronClient) {
    this._client = client
  }

  async firstElement(selector: string): Promise<ElementWrapper> {
    try {
      await this.waitUntilPresent(selector)

      const result = await this._client.$(selector)
      // if (result.length)
      return await element(this._client, result.value.ELEMENT, selector)
    } catch (err) {
      throw new Error(`Could not find element "${selector}"`)
    }
  }
  async firstElement_(testLabel: string): Promise<ElementWrapper> {
    return await this.firstElement(getSelector(testLabel))
  }

  async elements(selector: string, count?: number): Promise<ElementWrapper[]> {
    if (typeof count === 'number' && count <= 0)
      throw new Error('Count must be at least 1')
    let elementsSoFar: RawResult<Element>[] | undefined
    try {
      if (count)
        await this._client.waitUntil(async () => {
          const elements: RawResult<Element>[] = await this._client.$$(selector)
          elementsSoFar = elements
          return elements.length === count
        }, 10000)
      else elementsSoFar = await this._client.$$(selector)

      return (elementsSoFar as RawResult<Element>[]).map(v =>
        element(this._client, v.value.ELEMENT, selector)
      )
    } catch (err) {
      throw new Error(
        `Could not find ${count} elements with selector "${selector}". Instead found ${
          elementsSoFar ? elementsSoFar.length : 'none'
        } before: ${err.message}`
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

  async waitUntilPresent(selector: string) {
    try {
      return await this._client.waitForExist(selector)
    } catch (err) {
      throw new Error(`Element "${selector}" would not appear: ${err.message}`)
    }
  }
  async waitUntilPresent_(testLabel: string) {
    return await this.waitUntilPresent(getSelector(testLabel))
  }

  async waitUntilGone(selector: string) {
    try {
      return await this._client.waitUntil(
        async () => !(await this._client.isExisting(selector))
      )
    } catch (err) {
      throw new Error(
        `Element "${selector}" would not disappear: ${err.message}`
      )
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
  async getText_(selector: string) {
    return await this.getText(getSelector(selector))
  }

  async elementWithText(selector: string, text: string) {
    await this.waitForText('body', text)
    const elements = await this.elements(selector)
    const elementsText = await Promise.all(elements.map(e => e.getText()))
    const elementWithText = elements.find((e, i) =>
      elementsText[i].includes(text)
    )

    if (!elementWithText)
      throw new Error(
        `No elements matching "${selector}" contain text "${text}"`
      )
    return elementWithText
  }

  async waitForVisible(selector: string) {
    try {
      return await this._client.waitUntil(async () => {
        const element = await this.firstElement(selector)
        return await element.isVisible()
      }, 30000)
    } catch (err) {
      throw new Error(`Element "${selector}" would not show: ${err.message}`)
    }
  }
  async waitForVisible_(selector: string) {
    return await this.waitForVisible(getSelector(selector))
  }

  async waitForHidden(selector: string) {
    try {
      return await this._client.waitUntil(async () => {
        const element = await this.firstElement(selector)
        return !(await element.isVisible())
      }, 30000)
    } catch (err) {
      throw new Error(`Element "${selector}" would not hide: ${err.message}`)
    }
  }
  async waitForHidden_(testLabel: string) {
    return await this.waitForHidden(getSelector(testLabel))
  }

  /** possible values listed here: https://w3c.github.io/webdriver/#keyboard-actions **/
  async pressKeys(normalizedKeyValues: string[]) {
    await this._client.keys(normalizedKeyValues)
  }

  async submitForm() {
    await this._client.submitForm()
  }

  async waitUntil(condition: () => boolean | Promise<boolean>) {
    try {
      await this._client.waitUntil(condition)
    } catch (err) {
      throw new Error(`Wait condition was not met: ${condition.toString()}`)
    }
  }
}
