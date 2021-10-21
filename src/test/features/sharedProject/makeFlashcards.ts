import { testBlock, TestSetup } from '../../setUpDriver'
import { waveform$ } from '../../../components/waveformTestLabels'
import { setVideoTime } from '../../driver/media'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'

export default async function makeFlashcards({ client }: TestSetup) {
  await testBlock('select clip', async () => {
    await client.elements_(waveform$.waveformClip, 2)
    await client.clickElement_(waveform$.waveformClip)
    await client.waitForText_(flashcardSection$.container, '1 / 3')
    await client.waitForText_(
      flashcardSection$.container,
      'Relaxing while eating bamboo grass'
    )
  })

  await testBlock('seek to video time with with no visible clips', async () => {
    await setVideoTime(client, 0)
    await Promise.resolve(null)
    await setVideoTime(client, 60)
    await Promise.resolve(null)
    await setVideoTime(client, 39)
    await Promise.resolve(null)
    await client.waitForHidden_(waveform$.waveformClip)
  })

  await testBlock('create clip', async () => {
    await waveformMouseDrag(client, 589, 824)
    await client.waitForText_(flashcardSection$.container, '3 / 4')
  })
}
