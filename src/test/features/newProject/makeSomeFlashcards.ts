import { TestSetup } from '../../setup'
import { dragMouse, ElementWrapper } from '../../driver'
import { testLabels as flashcardSection } from '../../../components/FlashcardSection'
import { testLabels as tagsInput } from '../../../components/TagsInput'
import { testLabels as waveform } from '../../../components/Waveform'

export default async function makeTwoFlashcards({
  app,
  clientWrapper,
}: TestSetup) {
  await dragMouse(app, [402, 422], [625, 422])

  const { flashcardFields } = flashcardSection
  const { tagsInputContainer } = tagsInput

  await clientWrapper.waitUntilPresent_(flashcardFields)
  await fillInFlashcardFields(await clientWrapper.elements_(flashcardFields), {
    transcription: '笹を食べながらのんびりするのは最高だなぁ',
    pronunciation: 'sasa-o tabe-nágara nonbíri-suru-no-wa saikoo-da-naa',
    meaning: 'Relaxing while eating bamboo grass is the best',
  })

  await clientWrapper.clickElement_(`${tagsInputContainer} svg`)

  await clientWrapper.clickElement_(tagsInputContainer)

  await clientWrapper.setFieldValue_(`${tagsInputContainer} input`, 'pbc')

  await clientWrapper.pressKeys(['Enter'])

  await dragMouse(app, [756, 422], [920, 422])
  await dragMouse(app, [917, 422], [888, 422])

  const tagsDeleteButtons = await clientWrapper.elements_(
    `${tagsInputContainer} svg`
  )
  expect(tagsDeleteButtons).toHaveLength(1)

  const tagsInputContainerEl = await clientWrapper.element_(tagsInputContainer)
  await tagsInputContainerEl.waitForText('pbc')

  await fillInFlashcardFields(await clientWrapper.elements_(flashcardFields), {
    transcription: 'またこの子は昼間からゴロゴロして',
    pronunciation: 'mata kono ko-wa hirumá-kara góro-goro shite',
    meaning: 'This kid, lazing about again so early',
    notes: '"Goro-goro" is the sound of something big rolling around.',
  })

  expect(await clientWrapper.elements_(waveform.waveformClip)).toHaveLength(2)
}

async function fillInFlashcardFields(
  elements: ElementWrapper[],
  {
    transcription,
    pronunciation,
    meaning,
    notes,
  }: Partial<TransliterationFlashcardFields>
) {
  const [transcriptionEl, pronunciationEl, meaningEl, notesEl] = elements
  if (transcription) await transcriptionEl.setFieldValue(transcription)
  if (pronunciation) await pronunciationEl.setFieldValue(pronunciation)
  if (meaning) await meaningEl.setFieldValue(meaning)
  if (notes) await notesEl.setFieldValue(notes)
}
