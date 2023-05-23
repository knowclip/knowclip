import { IntegrationTestContext } from '../../setUpDriver'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { waveform$ } from '../../../components/waveformTestLabels'
import { fillInTransliterationCardFields } from '../../driver/flashcardSection'
import { setVideoTime } from '../../driver/media'
import {
  createClipViaWaveform,
  getClipSelector,
  waveformMouseDrag,
} from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { test } from '../../test'
import { mockSideEffects } from '../../../utils/sideEffects/mocks'

export default async function makeSomeFlashcards(
  context: IntegrationTestContext,
  cardIds: [string, string, string]
) {
  const { deleteButton } = flashcardForm$
  test('create first card', async () => {
    const { client } = context

    await createClipViaWaveform(context, 351, 438, cardIds[0])

    await client.waitForText_(flashcardSection$.container, '1 / 1')

    await fillInTransliterationCardFields(client, {
      transcription: 'Ich bin keine Katze, sagte Frederick böse',
      meaning: 'I am not a cat, said Frederick angrily',
    })
  })

  test('drag to create another card', async () => {
    await createClipViaWaveform(context, 921, 1000, cardIds[1])
  })

  test('wait for card to show', async () => {
    const { client } = context
    await client.waitForText_(flashcardSection$.container, '2 / 2')
  })

  test('fill in second card', async () => {
    const { client } = context

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

    await createClipViaWaveform(context, 176, 355, cardIds[2])

    await client.waitForText_(flashcardSection$.container, '3 / 3')
  })

  test('delete third card', async () => {
    const { client } = context

    await client.clickElement_(deleteButton)
    await client.waitUntilGone(getClipSelector(cardIds[2]))
  })
}
