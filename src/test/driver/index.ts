import { SpectronClient } from 'spectron'
import { dragMouse, clickAt } from './runEvents'
import { RawResult, Element } from 'webdriverio'

export { dragMouse, clickAt }

export const getSelector = (testLabel: string) => `#${testLabel}, .${testLabel}`

export type ElementWrapper = {
  elementId: string
  selector: string
  setFieldValue: (value: string) => Promise<void>
  click: () => Promise<void>
  getText: () => Promise<string>
  waitForText: (text: string) => Promise<void>
  doubleClick: () => Promise<void>
  isVisible: () => Promise<boolean>
  isSelected: () => Promise<boolean>
  getAttribute: (attributeName: string) => Promise<string>
}

const element = async (
  client: SpectronClient,
  id: string,
  selector: string
): Promise<ElementWrapper> => {
  const getText = async () => {
    const { state, value, message } = await client.elementIdText(id)

    if (state === 'failure') {
      throw new Error(
        `Could not get text for element "${selector}": ${message}`
      )
    }
    return value
  }
  return {
    elementId: id,
    selector,
    setFieldValue: async (value: string) => {
      const { state, message } = await client.elementIdValue(id, value)

      if (state === 'failure') {
        throw new Error(
          `Could not set value for element "${selector}": ${message}`
        )
      }
    },
    click: async () => {
      const { state, message } = await client.elementIdClick(id)
      if (state === 'failure') {
        throw new Error(`Could not click element "${selector}": ${message}`)
      }
    },
    doubleClick: async () => {
      const moveToResult: RawResult<void> = (await client.moveTo(id)) as any
      if (moveToResult.state === 'failure') {
        throw new Error(
          `Could not move to element "${selector}": ${moveToResult.message}`
        )
      }
      const doubleClickResult: RawResult<
        void
      > = (await client.doDoubleClick()) as any
      if (doubleClickResult.state === 'failure') {
        throw new Error(
          `Could not double click element "${selector}": ${
            doubleClickResult.message
          }`
        )
      }
    },
    getText,
    waitForText: async (text: string) => {
      let found
      try {
        await client.waitUntil(async () => {
          found = await getText()
          return Boolean(found) && found.includes(text)
        })
      } catch (err) {
        throw new Error(
          `Text "${text}" would not appear in "${found}": ${err.message}`
        )
      }
    },
    isVisible: async () => {
      const result: RawResult<boolean> = (await client.elementIdDisplayed(
        id
      )) as any
      const { state, message, value } = result

      if (state === 'failure') {
        throw new Error(`Could not get visibility of "${selector}": ${message}`)
      }
      return value
    },
    getAttribute: async (attributeName: string) => {
      const result: RawResult<string> = (await client.elementIdAttribute(
        id,
        attributeName
      )) as any
      const { state, message, value } = result

      if (state === 'failure') {
        throw new Error(
          `Could not get ${attributeName} attribute of "${selector}": ${message}`
        )
      }
      return value
    },
    isSelected: async () => {
      const result: RawResult<boolean> = (await client.elementIdSelected(
        id
      )) as any
      const { state, message, value } = result

      if (state === 'failure') {
        throw new Error(
          `Could not get selected status of "${selector}": ${message}`
        )
      }
      return value
    },
  }
}

export class ClientWrapper {
  _client: SpectronClient
  constructor(client: SpectronClient) {
    this._client = client
  }

  async element(selector: string): Promise<ElementWrapper> {
    try {
      await this.waitUntilPresent(selector)

      const result = await this._client.$(selector)
      // if (result.length)
      return await element(this._client, result.value.ELEMENT, selector)
    } catch (err) {
      throw new Error(`Could not find element "${selector}`)
    }
  }
  async element_(testLabel: string): Promise<ElementWrapper> {
    return await this.element(getSelector(testLabel))
  }

  async elements(selector: string): Promise<ElementWrapper[]> {
    await this.waitUntilPresent(selector)
    const result: RawResult<Element>[] = await this._client.$$(selector)
    return await Promise.all(
      result.map(el => element(this._client, el.value.ELEMENT, selector))
    )
  }
  async elements_(testLabel: string): Promise<ElementWrapper[]> {
    return await this.elements(getSelector(testLabel))
  }

  async setFieldValue(selector: string, value: string) {
    const element = await this.element(selector)
    await element.setFieldValue(value)
  }
  async setFieldValue_(testLabel: string, value: string) {
    await this.setFieldValue(getSelector(testLabel), value)
  }

  async clickElement(selector: string) {
    const element = await this.element(selector)
    await element.click()
  }
  async clickElement_(testLabel: string) {
    await this.clickElement(getSelector(testLabel))
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
    const element = await this.element(selector)

    return await element.getAttribute(attributeName)
  }
  async getAttribute_(testLabel: string, attributeName: string) {
    return await this.getAttribute(getSelector(testLabel), attributeName)
  }

  async waitForText(selector: string, text: string) {
    const element = await this.element(selector)
    await element.waitForText(text)
  }
  async waitForText_(selector: string, text: string) {
    return this.waitForText(getSelector(selector), text)
  }

  async getText(selector: string) {
    const element = await this.element(selector)
    return await element.getText()
  }
  async getText_(selector: string) {
    return this.getText(getSelector(selector))
  }

  async waitForVisible(selector: string) {
    return this.waitUntil(async () => {
      const element = await this.element(selector)
      return await element.isVisible()
    })
  }
  async waitForVisible_(selector: string) {
    return this.waitForVisible(getSelector(selector))
  }
  /** possible values listed here: https://w3c.github.io/webdriver/#keyboard-actions **/
  async pressKeys(normalizedKeyValues: string[]) {
    await this._client.keys(normalizedKeyValues)
  }

  async submitForm() {
    await this._client.submitForm()
  }

  async waitUntil(condition: () => boolean | Promise<boolean>) {
    await this._client.waitUntil(condition)
  }
}
