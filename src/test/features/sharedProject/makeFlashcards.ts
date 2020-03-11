import { TestSetup } from '../../spectronApp'
import { waveform$ } from '../../../components/Waveform'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { flashcardFieldMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { setVideoTime } from '../../driver/media'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'

export default async function makeFlashcards({ app, client }: TestSetup) {
  await client.elements_(waveform$.waveformClip, 3)
  await client.clickElement_(waveform$.waveformClip)
  await client.waitForText_(flashcardSection$.container, '1 / 3')

  await setVideoTime(client, 39)
  await client.waitForHidden_(waveform$.waveformClip)

  await waveformMouseDrag(app, client, 589, 824)
  await client.waitForText_(flashcardSection$.container, '3 / 4')
}
