import { TestSetup } from '../../spectronApp'
import { waveform$ } from '../../../components/Waveform'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { flashcardFieldMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { setVideoTime } from '../../driver/media'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSectionDisplayCard$ } from '../../../components/FlashcardSectionDisplayCard'
import { flashcardSection$ } from '../../../components/FlashcardSection'

export default async function makeFlashcardsWithSubtitles({
  app,
  client,
}: TestSetup) {
  await client.elements_(waveform$.waveformClip, 3)
  await client.clickElement_(waveform$.waveformClip)

  await client.firstElement_(flashcardSectionDisplayCard$.container)

  await setVideoTime(client, 39)
  await client.waitForHidden_(waveform$.waveformClip)

  await waveformMouseDrag(app, client, 589, 824)
  await client.waitForText_(flashcardSection$.container, '3 / 4')

  const [, , meaningFieldButton] = await client.elements_(
    flashcardFieldMenu$.openMenuButton,
    4
  )
  await meaningFieldButton.click()

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
