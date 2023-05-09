import { IntegrationTestContext } from '../../setUpDriver'
import { waveform$ } from '../../../components/waveformTestLabels'
import { setVideoTime } from '../../driver/media'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'

export default async function makeFlashcards(context: IntegrationTestContext) {
  test('select clip', async () => {
    const { client } = context

    await client.elements_(waveform$.waveformClip, 2)
    await client.clickElement_(waveform$.waveformClip)
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

  test('create clip', async () => {
    const { client } = context

    await waveformMouseDrag(client, 589, 824)
    await client.waitForText_(flashcardSection$.container, '3 / 4')
  })
}
