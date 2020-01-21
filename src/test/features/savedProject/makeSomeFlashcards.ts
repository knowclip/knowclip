import { TestSetup } from '../../app'
import { dragMouse } from '../../driver'
import { testLabels as flashcardSection } from '../../../components/FlashcardSection'
import { testLabels as waveform } from '../../../components/Waveform'
import { testLabels as confirmationDialog } from '../../../components/Dialog/Confirmation'
import { fillInFlashcardFields } from '../../driver/flashcardSection'
import { setVideoTime } from '../../driver/media'

export default async function makeSomeFlashcards({ app, client }: TestSetup) {
  const { flashcardFields, deleteButton } = flashcardSection

  await dragMouse(app, [351, 422], [438, 422])
  await fillInFlashcardFields(await client.elements_(flashcardFields), {
    transcription: 'Ich bin keine Katze, sagte Frederick böse',
    meaning: 'I am not a cat, said Frederick angrily',
  })

  await dragMouse(app, [921, 422], [1000, 422])
  await fillInFlashcardFields(await client.elements_(flashcardFields), {
    transcription: "Das hab' ich nicht gesagt",
    meaning: "I didn't say that",
  })

  await client.elements_(waveform.waveformClip, 2)

  await setVideoTime(client, 38)
  await client.waitForHidden_(waveform.waveformClip)

  await dragMouse(app, [176, 422], [355, 422])

  await client.elements_(waveform.waveformClip, 3)

  await client.clickElement_(deleteButton)
  await client.clickElement_(confirmationDialog.okButton)

  await client.elements_(waveform.waveformClip, 2)
}
