import { IntegrationTestContext } from '../../setUpDriver'
import { waveform$ } from '../../../components/waveformTestLabels'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { flashcardFieldMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { test } from '../../test'

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

    await client.waitForVisible(
      `.${waveform$.waveformClip}[data-clip-id="b9ba2184-cb5c-4d50-98c2-568bf8e75854"]`
    )

    await client.waitForText_(
      flashcardSection$.container,
      `Don't try to suck me up!`
    )
  })
}
