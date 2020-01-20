import { TestSetup } from '../../setup'
import { clickAt } from '../../driver'
import { testLabels as flashcardSection } from '../../../components/FlashcardSection'

export default async function navigateBetweenClips({
  app,
  clientWrapper,
}: TestSetup) {
  const { flashcardFields, previousClipButton, container } = flashcardSection

  await clientWrapper.waitUntilPresent_(flashcardFields)

  await clickAt(app, [650, 422])

  await clientWrapper.waitUntilGone_(flashcardFields)

  await clickAt(app, [800, 422])

  await clientWrapper.clickElement_(previousClipButton)

  expect(await clientWrapper.getText_(container)).toContain(
    'Relaxing while eating bamboo grass'
  )
}
