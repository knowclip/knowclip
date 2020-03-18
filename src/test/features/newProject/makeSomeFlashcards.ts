import { TestSetup } from '../../spectronApp'
import { tagsInput$ } from '../../../components/TagsInput'
import { waveform$ } from '../../../components/Waveform'
import { fillInTransliterationCardFields } from '../../driver/flashcardSection'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'

export default async function makeTwoFlashcards({ app, client }: TestSetup) {
  await waveformMouseDrag(app, client, 402, 625)

  await fillInTransliterationCardFields(client, {
    transcription: '笹を食べながらのんびりするのは最高だなぁ',
    pronunciation: 'sasa-o tabe-nágara nonbíri-suru-no-wa saikoo-da-naa',
    meaning: 'Relaxing while eating bamboo grass is the best',
  })

  await client.elements_(tagsInput$.tagChip, 1)
  await client.clickElement_(tagsInput$.tagChip)
  await client.elements_(tagsInput$.tagChip)
  await client.pressKeys(['Backspace'])
  await client.waitUntilGone_(tagsInput$.tagChip)

  await client.setFieldValue_(tagsInput$.inputField, 'pbc')
  await client.pressKeys(['Enter'])
  await client.elements_(tagsInput$.tagChip, 1)
  await client.waitForText_(tagsInput$.tagChip, 'pbc')

  await waveformMouseDrag(app, client, 756, 920)
  await client.waitForText_(flashcardSection$.container, '2 / 2')

  await waveformMouseDrag(app, client, 917, 888)

  await client.elements_(tagsInput$.tagChip, 1)
  await client.waitForText_(tagsInput$.tagChip, 'pbc')

  await fillInTransliterationCardFields(client, {
    transcription: 'またこの子は昼間からゴロゴロして',
    pronunciation: 'mata kono ko-wa hirumá-kara góro-goro shite',
    meaning: 'This kid, lazing about again so early',
    notes: '"Goro-goro" is the sound of something big rolling around.',
  })

  await client.elements_(waveform$.waveformClip, 2)
}
