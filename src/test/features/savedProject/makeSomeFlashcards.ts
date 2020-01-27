import { TestSetup } from '../../spectronApp'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { waveform$ } from '../../../components/Waveform'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { fillInTransliterationCardFields } from '../../driver/flashcardSection'
import { setVideoTime } from '../../driver/media'
import { waveformMouseDrag } from '../../driver/waveform'

export default async function makeSomeFlashcards({ app, client }: TestSetup) {
  const { deleteButton } = flashcardForm$

  await waveformMouseDrag(app, client, 351, 438)
  await fillInTransliterationCardFields(client, {
    transcription: 'Ich bin keine Katze, sagte Frederick böse',
    meaning: 'I am not a cat, said Frederick angrily',
  })

  await waveformMouseDrag(app, client, 921, 1000)
  await fillInTransliterationCardFields(client, {
    transcription: "Das hab' ich nicht gesagt",
    meaning: "I didn't say that",
  })

  await client.elements_(waveform$.waveformClip, 2)
  await setVideoTime(client, 38)
  await client.waitForHidden_(waveform$.waveformClip)

  await waveformMouseDrag(app, client, 176, 355)

  await client.elements_(waveform$.waveformClip, 3)

  await client.clickElement_(deleteButton)
  await client.clickElement_(confirmationDialog$.okButton)

  await client.elements_(waveform$.waveformClip, 2)
}
