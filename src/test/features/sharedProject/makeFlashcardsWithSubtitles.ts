import { testBlock, TestSetup } from '../../setUpDriver'
import { waveform$ } from '../../../components/Waveform'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { flashcardFieldMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'

export default async function makeFlashcardsWithSubtitles({
  client,
}: TestSetup) {
  await testBlock('open flashcard field menu for meaning field of third card', async () => {
    await client.waitForText_(flashcardSection$.container, '3 / 4')

    await client.clickElement(
      `.${flashcardForm$.meaningField} .${flashcardFieldMenu$.openMenuButtons}`
    )
  })

  await testBlock('link embedded track to meaning', async () => {
    await client.clickElement_(flashcardFieldMenu$.embeddedTrackMenuItem)
    await client.clickElement_(confirmationDialog$.okButton)
  })

  await testBlock('delete card', async () => {
    await client.clickElement_(flashcardForm$.deleteButton)
  
    await client.elements_(waveform$.waveformClip, 1)
    await client.waitForHidden_(waveform$.waveformClip)
  })

  await testBlock('create card', async () => {
    await waveformMouseDrag(client, 589, 824)
    await client.waitForVisible_(waveform$.waveformClip)
  
    await client.waitForText_(
      flashcardSection$.container,
      `Don't try to suck me up!`
    )
  })
}
