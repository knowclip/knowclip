import { RawResult } from 'webdriverio'
import { SpectronClient } from 'spectron'
import { TestSetup, _ } from '../../setup'
import { dragMouse } from '../../driver'
import { testLabels as flashcardSection } from '../../../components/FlashcardSection'
import { testLabels as tagsInput } from '../../../components/TagsInput'

export default async function makeTwoFlashcards({
  app,
  $_,
  $$_,
  client,
}: TestSetup) {
  await dragMouse(app, [402, 422], [625, 422])

  const { flashcardFields } = flashcardSection
  const { tagsInputContainer } = tagsInput
  await client.waitForExist(_(flashcardFields))
  await fillInFlashcardFields(await $$_(flashcardFields), client, {
    transcription: '笹を食べながらのんびりするのは最高だなぁ',
    pronunciation: 'sasa-o tabe-nagara nonbíri-suru-no-wa saikoo-da-naa',
    meaning: 'Relaxing while eating bamboo grass is the best',
  })
  await getDeleteTagButton($_(tagsInputContainer)).click()
  await $_(tagsInputContainer).click()

  const newTagTextField = getNewTagTextField($_(tagsInputContainer))
  await newTagTextField.setValue('pbc')
  await newTagTextField.keys(['Enter'])

  await dragMouse(app, [756, 422], [920, 422])

  const tagsChips = `.${tagsInputContainer} svg`
  expect(await client.$$(tagsChips)).toHaveLength(1)
  expect(await $_(tagsInputContainer).getText()).toContain('pbc')

  await fillInFlashcardFields(await $$_(flashcardFields), client, {
    transcription: 'またこの子は昼間からゴロゴロして',
    pronunciation: 'mata kono ko-wa hiruma-kara góro-goro shite',
    meaning: 'This kid, lazing about again so early',
    notes: '"Goro-goro" is the sound of something big rolling around.',
  })
}

const getNewTagTextField = (
  tagsInputContainerEl: WebdriverIO.Client<RawResult<WebdriverIO.Element>> &
    RawResult<WebdriverIO.Element>
) => tagsInputContainerEl.$('input')

const getDeleteTagButton = (
  tagsInputContainerEl: WebdriverIO.Client<RawResult<WebdriverIO.Element>> &
    RawResult<WebdriverIO.Element>
) => tagsInputContainerEl.$('svg')

async function fillInFlashcardFields(
  elements: RawResult<WebdriverIO.Element>[],
  client: SpectronClient,
  {
    transcription,
    pronunciation,
    meaning,
    notes,
  }: Partial<TransliterationFlashcardFields>
) {
  const [transcriptionId, pronunciationId, meaningId, notesId] = elements.map(
    el => el.value.ELEMENT
  )
  if (transcription) await client.elementIdValue(transcriptionId, transcription)
  if (pronunciation) await client.elementIdValue(pronunciationId, pronunciation)
  if (meaning) await client.elementIdValue(meaningId, meaning)
  if (notes) await client.elementIdValue(notesId, notes)
}
