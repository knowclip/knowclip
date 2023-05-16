import { IntegrationTestContext, ASSETS_DIRECTORY } from '../../setUpDriver'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu'
import { fileSelectionForm$ } from '../../../components/Dialog/FileSelectionDialog'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { waveformMouseHoldAndDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { getSelector } from '../../driver/ClientWrapper'
import { retryUntil } from '../../driver/retryUntil'
import { test } from '../../test'

export default async function manuallyLocateAsset(
  context: IntegrationTestContext
) {
  test('go to locate external subtitles file in menu', async () => {
    const { app, client } = context

    await client.clickElement_(subtitlesMenu$.openMenuButton)

    // should expect second menu item has text "pbc_jp.ass"
    const [, pbcJpOpenTrackSubmenuButton] = await client.elements_(
      subtitlesMenu$.openTrackSubmenuButton
    )
    pbcJpOpenTrackSubmenuButton.click()

    await retryUntil({
      action: () =>
        client.clickElement_(subtitlesMenu$.locateExternalFileButton),
      conditionName: 'file selection form appears',
      check: () =>
        app.client.$(getSelector(fileSelectionForm$.form)).isExisting(),
    })
  })

  test('locate PBC japanese subtitles file', async () => {
    const { app, client } = context

    await mockElectronHelpers(app, {
      showOpenDialog: [Promise.resolve([join(ASSETS_DIRECTORY, 'pbc_jp.ass')])],
    })

    await client.waitForText_(fileSelectionForm$.form, 'pbc_jp.ass')
    await client.clickElement_(fileSelectionForm$.filePathField)
    await client.clickElement_(fileSelectionForm$.continueButton)
    await client.waitUntilGone_(fileSelectionForm$.continueButton)
  })

  test('close subtitles menu', async () => {
    const { client } = context

    await client.clickElement('body')
    await client.waitUntilGone_(subtitlesMenu$.trackMenuItems)
  })

  test('fill in existing card with text from loaded subtitles via stretch', async () => {
    const { client } = context

    await waveformMouseHoldAndDrag(client, 300, 591, 572)

    await client.waitForText_(flashcardSection$.container, 'ああー  吸わないで')
  })
}
