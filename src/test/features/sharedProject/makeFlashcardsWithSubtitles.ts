import { testBlock, TestSetup } from '../../setUpDriver'
import { waveform$ } from '../../../components/Waveform'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { flashcardFieldMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { stdout } from 'process'

export default async function makeFlashcardsWithSubtitles({
  client,
}: TestSetup) {
  await testBlock(
    'open flashcard field menu for meaning field of third card',
    async () => {
      await client.waitForText_(flashcardSection$.container, '3 / 4')

      await client.clickElement(
        `.${flashcardForm$.meaningField} .${flashcardFieldMenu$.openMenuButtons}`
      )
    }
  )

  await testBlock('link embedded track to meaning', async () => {
    await client.clickElement_(flashcardFieldMenu$.embeddedTrackMenuItem)
    await client.clickElement_(confirmationDialog$.okButton)
  })

  await testBlock('delete card', async () => {
    await client.clickElement_(flashcardForm$.deleteButton)

    await client.elements_(waveform$.waveformClip, 1)
    await client.waitForHidden_(waveform$.waveformClip)
    process.stdout.write('HIDDEN \n')
  })

  await testBlock('create card', async () => {
    await waveformMouseDrag(client, 589, 824)
    process.stdout.write('DRAGGED \n')
    const els = await client.elements_(waveform$.waveformClip)
    process.stdout.write('CLIP PRESENT \n')

    await client.waitUntil(() => els[1].isVisible())
    // process.stdout.write(`VISIBLE 1b: ${visible} \n`) // this didnt get logged, it seems
    // await client.waitForVisible_(waveform$.waveformClip)
    process.stdout.write('VISIBLE 2 \n') // this didnt get logged, it seems

    console.log('made clip')
    console.log('bodytext', await client.getText('body'))

    await client.waitForText_(
      flashcardSection$.container,
      `Don't try to suck me up!`
    )
  })
}
