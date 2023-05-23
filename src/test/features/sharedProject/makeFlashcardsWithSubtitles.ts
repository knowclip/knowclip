import { IntegrationTestContext } from '../../setUpDriver'
import { waveform$ } from '../../../components/waveformTestLabels'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm.testLabels'
import { flashcardSectionFieldPopoverMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu.testLabels'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation.testLabels'
import { createClipViaWaveform } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection.testLabels'
import { test } from '../../test'

export default async function makeFlashcardsWithSubtitles(
  context: IntegrationTestContext,
  newClipId: string
) {
  test('open flashcard field menu for meaning field of third card', async () => {
    const { client } = context

    await client.waitForText_(flashcardSection$.container, '3 / 4')

    await client.clickElement(
      `.${flashcardForm$.meaningField} .${flashcardSectionFieldPopoverMenu$.openMenuButtons}`
    )
  })

  test('link embedded track to meaning', async () => {
    const { client } = context

    await client.clickElement_(
      flashcardSectionFieldPopoverMenu$.embeddedTrackMenuItem
    )
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

    await createClipViaWaveform(context, 589, 824, newClipId)

    await client.waitForText_(
      flashcardSection$.container,
      `Don't try to suck me up!`
    )
  })
}
