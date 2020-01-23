import { TestSetup } from '../../spectronApp'
import { clickAt } from '../../driver/ClientWrapper'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'

export default async function navigateBetweenClips({ app, client }: TestSetup) {
  const { previousClipButton, container } = flashcardSection$

  await client.waitUntilPresent_(flashcardForm$.flashcardFields)

  await clickAt(app, [650, 422])

  await client.waitUntilGone_(flashcardForm$.flashcardFields)

  await clickAt(app, [800, 422])

  await client.clickElement_(previousClipButton)

  expect(await client.getText_(container)).toContain(
    'Relaxing while eating bamboo grass'
  )
}
