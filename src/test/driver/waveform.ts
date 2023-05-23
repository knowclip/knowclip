import { clickAt } from './runEvents'
import { ClientWrapper } from './ClientWrapper'
import { main$ } from '../../components/Main'
import { waveform$ } from '../../components/waveformTestLabels'
import { TestDriver } from './TestDriver'

export const waveformSelector = `#${main$.container} > svg`

export async function clickClip(
  app: TestDriver,
  client: ClientWrapper,
  clipId: string
) {
  const clipSelector = `.${waveform$.waveformClip}[data-clip-id="${clipId}"]`
  const clip = await client.firstElement(clipSelector)
  const rect = await client.getBoundingClientRect(clipSelector)

  const offsetFromCorner = {
    x: Math.round(rect.width / 2),
    y: Math.round(rect.height / 2),
  }
  await clip.moveTo(offsetFromCorner)

  await clickAt(app, [rect.x + offsetFromCorner.x, rect.y + offsetFromCorner.y])
}

async function getWaveformMidpoint(client: ClientWrapper) {
  const rect = await client.getBoundingClientRect(waveformSelector)

  return {
    x: rect.x + Math.round(rect.width / 2),
    y: rect.y + Math.round(rect.height / 2),
  }
}

export async function waveformMouseDrag(
  client: ClientWrapper,
  start: number,
  end: number
) {
  try {
    const waveformMidpoint = await getWaveformMidpoint(client)
    await client._driver.client.actions([
      client._driver.client
        .action('pointer')
        .move({
          origin: 'viewport',
          x: start,
          y: waveformMidpoint.y,
        })
        .down()
        .move({
          origin: 'viewport',
          x: end,
          y: waveformMidpoint.y,
          duration: 400,
        })
        .up(),
    ])
    // TODO: not-ideal flaky prevention, see if better text waiting is possible
    await sleep(100)
  } catch (err) {
    throw err
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
