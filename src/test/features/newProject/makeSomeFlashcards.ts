import { IntegrationTestContext } from '../../setUpDriver'
import { tagsInput$ } from '../../../components/TagsInput'
import { waveform$ } from '../../../components/waveformTestLabels'
import { fillInTransliterationCardFields } from '../../driver/flashcardSection'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { test } from '../../test'

export default async function makeTwoFlashcards(
  context: IntegrationTestContext
) {
  test('create first card', async () => {
    const { client } = context
    await waveformMouseDrag(client, 402, 625)
    await client.waitForText_(flashcardSection$.container, '1 / 1')
  })

  test('fill in first card fields', async () => {
    const { client } = context
    await fillInTransliterationCardFields(client, {
      transcription: '笹を食べながらのんびりするのは最高だなぁ',
      pronunciation: 'sasa-o tabe-nágara nonbíri-suru-no-wa saikoo-da-naa',
      meaning: 'Relaxing while eating bamboo grass is the best',
    })
  })

  test('edit tags', async () => {
    const { client } = context
    await client.elements_(tagsInput$.tagChip, 1)
    await client.clickElement_(tagsInput$.tagChip)
    await client.elements_(tagsInput$.tagChip)
    await client.pressKeys(['Backspace'])
    await client.waitUntilGone_(tagsInput$.tagChip)

    await client.setFieldValue_(tagsInput$.inputField, 'pbc')
    await client.pressKeys(['Enter'])
    await client.elements_(tagsInput$.tagChip, 1)
    await client.waitForText_(tagsInput$.tagChip, 'pbc')
  })

  test('create second card', async () => {
    const { client } = context
    await waveformMouseDrag(client, 756, 920)
    await client.waitForText_(flashcardSection$.container, '2 / 2')
  })

  test('select card via waveform', async () => {
    const { client } = context
    await waveformMouseDrag(client, 917, 888)

    await client.elements_(tagsInput$.tagChip, 1)
    await client.waitForText_(tagsInput$.tagChip, 'pbc')
  })

  test('fill in second card fields', async () => {
    const { client } = context
    await fillInTransliterationCardFields(client, {
      transcription: 'またこの子は昼間からゴロゴロして',
      pronunciation: 'mata kono ko-wa hirumá-kara góro-goro shite',
      meaning: 'This kid, lazing about again so early',
      notes: '"Goro-goro" is the sound of something big rolling around.',
    })

    await client.elements_(waveform$.waveformClip, 2)
  })
}
