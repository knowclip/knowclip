import { TestSetup } from '../../setup'
import { clickAt } from '../../driver'
import { testLabels as flashcardSection } from '../../../components/FlashcardSection'

export default async function navigateBetweenClips({ app, $, $$ }: TestSetup) {
  const { flashcardFields, previousClipButton, container } = flashcardSection

  await clickAt(app, [650, 422])

  expect(await $$(flashcardFields)).toHaveLength(0)

  await clickAt(app, [800, 422])

  await $(previousClipButton).click()

  expect(await $(container).getText()).toContain(
    'Relaxing while eating bamboo grass'
  )
}
