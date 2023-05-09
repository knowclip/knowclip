import { IntegrationTestContext } from '../../setUpDriver'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { waveform$ } from '../../../components/waveformTestLabels'
import { fillInTransliterationCardFields } from '../../driver/flashcardSection'
import { setVideoTime } from '../../driver/media'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'

export default async function makeSomeFlashcards(
  context: IntegrationTestContext
) {
  const { deleteButton } = flashcardForm$
  test('create first card', async () => {
    const { client } = context

    await waveformMouseDrag(client, 351, 438)
    await client.waitForText_(flashcardSection$.container, '1 / 1')

    await fillInTransliterationCardFields(client, {
      transcription: 'Ich bin keine Katze, sagte Frederick böse',
      meaning: 'I am not a cat, said Frederick angrily',
    })
  })

  test('create another card', async () => {
    const { client } = context

    await waveformMouseDrag(client, 921, 1000)
    await client.waitForText_(flashcardSection$.container, '2 / 2')

    await fillInTransliterationCardFields(client, {
      transcription: "Das hab' ich nicht gesagt",
      meaning: "I didn't say that",
    })
  })

  test('seek to new video time', async () => {
    const { client } = context

    await setVideoTime(client, 38)
    await client.waitUntilGone_(waveform$.waveformClip)
  })

  test('create a third card', async () => {
    const { client } = context

    await waveformMouseDrag(client, 176, 355)
    await client.waitForText_(flashcardSection$.container, '3 / 3')
    await client.waitForVisible_(waveform$.waveformClip)
  })

  test('delete third card', async () => {
    const { client } = context

    await client.clickElement_(deleteButton)
    await client.waitUntilGone_(waveform$.waveformClip)
  })

  // await setVideoTime(client, 0)
  // await setVideoTime(client, 20)
  // await waveformMouseDrag(client, 20, 445)
  // await fillInTransliterationCardFields(client, {
  //   transcription:
  //     'Sie hat nur fast alles, was ein Schwein auch hat. Aber sie spricht anders, sie sagt »Miau, miau, miau!«',
  // })
  // await waveformMouseDrag(client, 575, 1024)
  // await fillInTransliterationCardFields(client, {
  //   transcription:
  //     'Schön! seufzte Piggeldy verzückt.\n\nSchön, wie du eben »Miau!« gemacht hast. Ein Glück, dass du keine Mäuse frisst.',
  // })
}
