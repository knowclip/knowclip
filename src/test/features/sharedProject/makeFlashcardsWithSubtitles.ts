import { TestSetup } from '../../spectronApp'
import { waveform$ } from '../../../components/Waveform'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { flashcardFieldMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'

export default async function makeFlashcardsWithSubtitles({
  app,
  client,
}: TestSetup) {
  await client.waitForText_(flashcardSection$.container, '3 / 4')

  await client.clickElement(
    `.${flashcardForm$.meaningField} .${flashcardFieldMenu$.openMenuButtons}`
  )

  const [embeddedSubtitlesTrackButton] = await client.elements_(
    flashcardFieldMenu$.menuItem
  )
  await embeddedSubtitlesTrackButton.click()
  await client.clickElement_(confirmationDialog$.okButton)

  await client.clickElement_(flashcardForm$.deleteButton)
  await client.clickElement_(confirmationDialog$.okButton)

  await client.elements_(waveform$.waveformClip, 3)

  await waveformMouseDrag(app, client, 589, 824)
  await client.elements_(waveform$.waveformClip, 4)

  await client.waitForText_(
    flashcardSection$.container,
    `Don't try to suck me up!`
  )
}
