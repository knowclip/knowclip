import { IntegrationTestContext } from '../../setUpDriver'
import { flashcardSectionFieldPopoverMenu$ } from '../../../components/FlashcardSectionFieldPopoverMenu.testLabels'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu.testLabels'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation.testLabels'
import { flashcardSection$ } from '../../../components/FlashcardSection.testLabels'
import { clickClip } from '../../driver/waveform'
import { test } from '../../test'

export default async function linkSubtitlesToFields(
  context: IntegrationTestContext,
  { firstClipId }: { firstClipId: string }
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

    await clickClip(app, client, firstClipId)

    await client.waitForText_(flashcardSection$.container, '1 / 3')
  })

  test('link track and fill in text', async () => {
    const { client } = context

    await client.clickElement_(
      flashcardSectionFieldPopoverMenu$.openMenuButtons
    )
    await client.elements_(flashcardSectionFieldPopoverMenu$.menuItem, 2)

    await client.clickElement_(
      flashcardSectionFieldPopoverMenu$.externalTrackMenuItem
    )
    await client.waitUntilGone_(
      flashcardSectionFieldPopoverMenu$.externalTrackMenuItem
    )

    await client.waitUntilPresent_(confirmationDialog$.okButton)
    await client.clickElement_(confirmationDialog$.okButton)
    await client.waitUntilGone_(confirmationDialog$.okButton)
  })
  test('wait for text to be filled in', async () => {
    const { client } = context
    await client.waitForText_(
      flashcardSection$.container,
      '笹を食べながらのんびりするのは最高だなぁ'
    )
  })
}
