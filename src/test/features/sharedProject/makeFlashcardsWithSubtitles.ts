import { IntegrationTestContext } from '../../setUpDriver'
import { waveform$ } from '../../../components/waveformTestLabels'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { flashcardFieldMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'

export default async function makeFlashcardsWithSubtitles(
  context: IntegrationTestContext
) {
  test('open flashcard field menu for meaning field of third card', async () => {
    const { client } = context

    await client.waitForText_(flashcardSection$.container, '3 / 4')

    await client.clickElement(
      `.${flashcardForm$.meaningField} .${flashcardFieldMenu$.openMenuButtons}`
    )
  })

  test('link embedded track to meaning', async () => {
    const { client } = context

    await client.clickElement_(flashcardFieldMenu$.embeddedTrackMenuItem)
    await client.clickElement_(confirmationDialog$.okButton)
  })

  test('delete card', async () => {
    const { client } = context

    await client.clickElement_(flashcardForm$.deleteButton)

    await client.elements_(waveform$.waveformClip, 1)
    await client.waitForHidden_(waveform$.waveformClip)
  })

  test('create card', async () => {
    const { client } = context

    await waveformMouseDrag(client, 589, 824)
    const els = await client.elements_(waveform$.waveformClip)

    await client.waitUntil(() => els[1].isVisible())

    await client.waitForText_(
      flashcardSection$.container,
      `Don't try to suck me up!`
    )
  })
}
