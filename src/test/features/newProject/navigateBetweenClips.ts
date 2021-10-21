import { testBlock, TestSetup } from '../../setUpDriver'
import { clickAt } from '../../driver/ClientWrapper'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { flashcardSectionDisplayCard$ } from '../../../components/FlashcardSectionDisplayCard'

export default async function navigateBetweenClips({ app, client }: TestSetup) {
  const { previousClipButton, container } = flashcardSection$

  await testBlock('click away from selected clip', async () => {
    await client.waitUntilPresent_(flashcardForm$.flashcardFields)

    await clickAt(app, [650, 711])
    // await client.clickAtOffset('html', { x: 650, y: 711 })
    // await client.clickAtOffset('body', { x: 650, y: 711 })

    // // const waveform = await client.firstElement(waveformSelector)
    // await client.moveTo(waveformSelector, { x: 650, y: 20 })
    // await app.client.performActions([
    //   {
    //     type: 'pointer',
    //     id: 'finger',
    //     parameters: { pointerType: 'mouse' },
    //     actions: [
    //       { type: 'pointerDown', button: 0 },
    //       { type: 'pause' },
    //       { type: 'pointerUp', button: 0 },
    //     ],
    //   },
    // ])

    await client.waitUntilGone_(flashcardForm$.flashcardFields)
  })

  await testBlock('click to select new clip', async () => {
    await clickAt(app, [800, 711])
    // // await client.clickAtOffset('body', { x: 800, y: 711 })
    // // await client.clickAtOffset(waveformSelector, { x: 800, y: 20 })
    // await client.moveTo(waveformSelector, { x: 800, y: 20 })
    // await app.client.positionClick()

    await client.waitUntilPresent_(flashcardSectionDisplayCard$.container)
  })

  await testBlock('navigate to previous clip', async () => {
    await client.clickElement_(flashcardSectionDisplayCard$.container)
    await client.waitForVisible_(previousClipButton)

    await client.clickElement_(previousClipButton)

    await client.waitForText('body', '1 / 2')

    expect(await client.getText_(container)).toContain(
      'Relaxing while eating bamboo grass'
    )
  })
}
