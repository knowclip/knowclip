import { TestSetup } from '../../setup'
import { clickAt } from '../../driver'
import { testLabels as flashcardSection } from '../../../components/FlashcardSection'

export default async function navigateBetweenClips({
  app,
  $_,
  $$_,
}: TestSetup) {
  const { flashcardFields, previousClipButton, container } = flashcardSection

  await clickAt(app, [650, 422])

  expect(await $$_(flashcardFields)).toHaveLength(0)

  await clickAt(app, [800, 422])

  await $_(previousClipButton).click()

  expect(await $_(container).getText()).toContain(
    'Relaxing while eating bamboo grass'
  )
}
