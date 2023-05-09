import { IntegrationTestContext } from '../../setUpDriver'
import { clickAt } from '../../driver/ClientWrapper'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { flashcardSectionDisplayCard$ } from '../../../components/FlashcardSectionDisplayCard'

export default async function navigateBetweenClips(
  context: IntegrationTestContext
) {
  const { previousClipButton, container } = flashcardSection$

  test('click away from selected clip', async () => {
    const { client, app } = context

    await client.waitUntilPresent_(flashcardForm$.flashcardFields)

    await clickAt(app, [650, 711])
    await client.waitUntilGone_(flashcardForm$.flashcardFields)
  })

  test('click to select new clip', async () => {
    const { client, app } = context

    await clickAt(app, [800, 711])

    await client.waitUntilPresent_(flashcardSectionDisplayCard$.container)
  })

  test('navigate to previous clip', async () => {
    const { client } = context

    await client.clickElement_(flashcardSectionDisplayCard$.container)
    await client.waitForVisible_(previousClipButton)

    await client.clickElement_(previousClipButton)

    await client.waitForText('body', '1 / 2')

    expect(await client.getText_(container)).toContain(
      'Relaxing while eating bamboo grass'
    )
  })
}
