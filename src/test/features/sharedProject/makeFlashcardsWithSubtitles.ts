import { TestSetup } from '../../spectronApp'
import { testLabels as waveform } from '../../../components/Waveform'
import { testLabels as flashcardForm } from '../../../components/FlashcardSectionForm'
import { testLabels as flashcardFormFieldMenu } from '../../../components/FlashcardSectionFormFieldPopoverMenu'
import { testLabels as confirmationDialog } from '../../../components/Dialog/Confirmation'
import { setVideoTime } from '../../driver/media'
import { dragMouse } from '../../driver/runEvents'

export default async function makeFlashcardsWithSubtitles({
  app,
  client,
}: TestSetup) {
  await client.elements_(waveform.waveformClip, 3)
  await client.clickElement_(waveform.waveformClip)

  await client.waitForText_(
    flashcardForm.container,
    'Transcription (External subtitles track 1)'
  )

  await setVideoTime(client, 39)
  await client.waitForHidden_(waveform.waveformClip)

  await dragMouse(app, [589, 422], [824, 422])
  await client.elements_(waveform.waveformClip, 4)

  const [, , meaningFieldButton] = await client.elements_(
    flashcardFormFieldMenu.openMenuButton
  )
  await meaningFieldButton.click()

  const [embeddedSubtitlesTrackButton] = await client.elements_(
    flashcardFormFieldMenu.menuItem
  )
  await embeddedSubtitlesTrackButton.click()
  // await client.waitUntilGone_(flashcardFormFieldMenu.menuItem)

  await client.clickElement_(flashcardForm.deleteButton)
  await client.clickElement_(confirmationDialog.okButton)

  await client.elements_(waveform.waveformClip, 3)

  await dragMouse(app, [589, 422], [824, 422])
  await client.elements_(waveform.waveformClip, 4)

  await client.waitForText_(flashcardForm.container, `Don't try to suck me up!`)
}
