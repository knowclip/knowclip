import { SpectronClient } from 'spectron'
import { RawResult } from 'webdriverio'

/** A wrapper for `WebDriverIO.Client` method results
 * for when the `ClientWrapper` methods can't be called directly, e.g.
 * when targeting specific elements queried via `ClientWrapper#elements`.
 */
export interface ElementWrapper {
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

export const element = (
  client: SpectronClient,
  id: string,
  selector: string
): ElementWrapper => {
  const getText = async () => {
    const result = await client.elementIdText(id)
    const { state, value, message } = result

    if (state === 'failure') {
      throw new Error(
        `Could not get text for element "${selector}": ${message}`
      )
    }

    if (typeof value !== 'string') {
      console.error(result, JSON.stringify(result))
      throw new Error(
        'Could not get text, instead got ' +
          (value && JSON.stringify(value as any))
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
          typeof found === 'string'
            ? `Selector "${selector}" received not "${text}", but "${found}", and then there was a problem: ${
                err.message
              }`
            : `Could not get text from "${selector}: ` + err.message
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
