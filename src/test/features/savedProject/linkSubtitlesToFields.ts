import { IntegrationTestContext } from '../../setUpDriver'
import { flashcardFieldMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { clickClip } from '../../driver/waveform'

export default async function linkSubtitlesToFields(
  context: IntegrationTestContext
) {
  test('open media menu', async () => {
    const { client } = context

    await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
    await client.waitForText_(
      mediaFilesMenu$.mediaFileMenuItem,
      'polar_bear_cafe.mp4'
    )
  })

  test('try to open different media file via menu', async () => {
    const { client } = context

    await client.clickElement_(mediaFilesMenu$.mediaFileMenuItem)
    await client.waitForText_(
      mediaFilesMenu$.openMediaFilesMenuButton,
      'polar_bear_cafe.mp4'
    )
  })

  test('select clip', async () => {
    const { app, client } = context

    await clickClip(app, client, 0, 2)
    await client.waitForText_(flashcardSection$.container, '1 / 3')
  })

  test('link track and fill in text', async () => {
    const { client } = context

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
