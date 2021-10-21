import { testBlock, TestSetup } from '../../setUpDriver'
import { flashcardFieldMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { clickClip } from '../../driver/waveform'

export default async function linkSubtitlesToFields({
  client,
  app,
}: TestSetup) {
  await testBlock('open media menu', async () => {
    await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
    await client.waitForText_(
      mediaFilesMenu$.mediaFileMenuItem,
      'polar_bear_cafe.mp4'
    )
  })

  await testBlock('try to open different media file via menu', async () => {
    await client.clickElement_(mediaFilesMenu$.mediaFileMenuItem)
    await client.waitForText_(
      mediaFilesMenu$.openMediaFilesMenuButton,
      'polar_bear_cafe.mp4'
    )
  })

  await testBlock('select clip', async () => {
    await clickClip(app, client, 0, 2)
    await client.waitForText_(flashcardSection$.container, '1 / 3')
  })

  await testBlock('link track and fill in text', async () => {
    await client.clickElement_(flashcardFieldMenu$.openMenuButtons)
    await client.elements_(flashcardFieldMenu$.menuItem, 2)
    await client.clickElement_(flashcardFieldMenu$.externalTrackMenuItem)
    await client.waitUntilGone_(flashcardFieldMenu$.externalTrackMenuItem)
    await client.waitUntilPresent_(confirmationDialog$.okButton)
    await client.clickElement_(confirmationDialog$.okButton)
    await client.waitForText_(
      flashcardSection$.container,
      '笹を食べながらのんびりするのは最高だなぁ'
    )
  })
}
