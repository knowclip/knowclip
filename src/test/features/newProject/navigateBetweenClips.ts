import { TestSetup } from '../../setUpDriver'
import { clickAt } from '../../driver/ClientWrapper'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'

export default async function navigateBetweenClips({ app, client }: TestSetup) {
  const { previousClipButton, container } = flashcardSection$

  await client.waitUntilPresent_(flashcardForm$.flashcardFields)

  await clickAt(app, [650, 655])

  await client.waitUntilGone_(flashcardForm$.flashcardFields)

  await clickAt(app, [800, 655])

  await client.clickElement_(previousClipButton)

  await client.waitForText('body', '1 / 2')

  expect(await client.getText_(container)).toContain(
    'Relaxing while eating bamboo grass'
  )
}
