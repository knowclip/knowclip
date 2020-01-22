import { TestSetup } from '../../spectronApp'
import { clickAt } from '../../driver/ClientWrapper'
import { testLabels as flashcardSection } from '../../../components/FlashcardSection'

export default async function navigateBetweenClips({ app, client }: TestSetup) {
  const { flashcardFields, previousClipButton, container } = flashcardSection

  await client.waitUntilPresent_(flashcardFields)

  await clickAt(app, [650, 422])

  await client.waitUntilGone_(flashcardFields)

  await clickAt(app, [800, 422])

  await client.clickElement_(previousClipButton)

  expect(await client.getText_(container)).toContain(
    'Relaxing while eating bamboo grass'
  )
}
