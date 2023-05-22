import runEvents, { clickAt, dragMouse } from './runEvents'
import { ClientWrapper } from './ClientWrapper'
import { main$ } from '../../components/Main'
import { waveform$ } from '../../components/waveformTestLabels'
import { TestDriver } from './TestDriver'

export const waveformSelector = `#${main$.container} > svg`

export async function waveformMouseDrag(
  client: ClientWrapper,
  start: number,
  end: number
) {
  const waveform = await client.firstElement(waveformSelector)
  try {
    if (!waveform.elementId) throw new Error('Waveform elementId expired')
    const midpoint = await getWaveformMidpoint(client, waveform.elementId)
    await dragMouse(client._driver, [start, midpoint], [end, midpoint])
  } catch (err) {
    throw err
  }
}

export async function clickClip(
  app: TestDriver,
  client: ClientWrapper,
  clipId: string
) {
  const clip = await client.firstElement(
    `.${waveform$.waveformClip}[data-clip-id="${clipId}"]`
  )
  const rect = await client._driver.client.getElementRect(clip.elementId)

  const offsetFromCorner = {
    x: Math.round(rect.width / 2),
    y: Math.round(rect.height / 2),
  }
  await clip.moveTo(offsetFromCorner)

  await clickAt(app, [rect.x + offsetFromCorner.x, rect.y + offsetFromCorner.y])
}

async function getWaveformMidpoint(client: ClientWrapper, elementId: string) {
  const rect = await client._driver.client.getElementRect(elementId)

  const { y, height } = rect
  const midpoint = y + Math.round(height / 2)
  return midpoint
}

export async function waveformMouseHoldAndDrag(
  client: ClientWrapper,
  start: number,
  end: number,
  initialHoldTime: number = 300
) {
  const waveform = await client.firstElement(waveformSelector)
  try {
    const rect = await client._driver.client.getElementRect(waveform.elementId)

    const { y, height } = rect
    const midpoint = y + Math.round(height / 2)
    await dragMouse(client._driver, [start, midpoint], [end, midpoint], {
      initialHoldTime,
    })
  } catch (err) {
    throw err
  }
}
