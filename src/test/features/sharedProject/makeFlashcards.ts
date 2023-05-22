import { IntegrationTestContext } from '../../setUpDriver'
import { waveform$ } from '../../../components/waveformTestLabels'
import { setVideoTime } from '../../driver/media'
import { clickClip, waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { test } from '../../test'

export default async function makeFlashcards(
  context: IntegrationTestContext,
  firstExistingClipId: string
) {
  test('select clip', async () => {
    const { client } = context

    await clickClip(context.app, client, firstExistingClipId)
    await client.waitForText_(flashcardSection$.container, '1 / 3')
    await client.waitForText_(
      flashcardSection$.container,
      'Relaxing while eating bamboo grass'
    )
  })

  test('seek to video time with with no visible clips', async () => {
    const { client } = context

    await setVideoTime(client, 0)
    await Promise.resolve(null)
    await setVideoTime(client, 60)
    await Promise.resolve(null)
    await setVideoTime(client, 39)
    await Promise.resolve(null)
    await client.waitForHidden_(waveform$.waveformClip)
  })

  test('create clip with mouse drag', async () => {
    const { client } = context

    await waveformMouseDrag(client, 589, 824)
    await client.waitForText_(flashcardSection$.container, '3 / 4')
  })
}
