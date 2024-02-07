import { clickAt } from './runEvents'
import { ClientWrapper } from './ClientWrapper'
import { main$ } from '../../components/Main.testLabels'
import { waveform$ } from '../../components/waveformTestLabels'
import { TestDriver } from './TestDriver'
import { mockSideEffects } from '../../utils/sideEffects/mocks'
import { IntegrationTestContext } from '../setUpDriver'

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
  await clip.moveTo()

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
    console.error('Error in waveformMouseDrag')
    throw err
  }
}

export async function createClipViaWaveform(
  { app, client }: IntegrationTestContext,
  start: number,
  end: number,
  id: string
) {
  await mockSideEffects(app, {
    uuid: [id],
  })

  await waveformMouseDrag(client, start, end)

  await client.waitUntilPresent(getClipSelector(id))
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getClipSelector(clipId: string) {
  return `.${waveform$.waveformClip}[data-clip-id="${clipId}"]`
}
