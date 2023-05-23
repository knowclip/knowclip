import { IntegrationTestContext, ASSETS_DIRECTORY } from '../../setUpDriver'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu.testLabels'
import { fileSelectionDialog$ } from '../../../components/Dialog/FileSelectionDialog.testLabels'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { waveformMouseDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection.testLabels'
import { getSelector } from '../../driver/ClientWrapper'
import { retryUntil } from '../../driver/retryUntil'
import { test } from '../../test'

export default async function manuallyLocateAsset(
  context: IntegrationTestContext
) {
  test('go to locate external subtitles file in menu', async () => {
    const { app, client } = context

    await client.clickElement_(subtitlesMenu$.openMenuButton)

    const [, pbcJpOpenTrackSubmenuButton] = await client.elements_(
      subtitlesMenu$.openTrackSubmenuButton
    )

    await retryUntil({
      action: () => pbcJpOpenTrackSubmenuButton.click(),
      conditionName: 'submenu opens',
      check: () => client.waitUntilPresent_(subtitlesMenu$.trackSubmenu, 10000),
    })

    await retryUntil({
      action: () =>
        client.clickElement_(subtitlesMenu$.locateExternalFileButton),
      conditionName: 'file selection form appears',
      check: () =>
        app.client.$(getSelector(fileSelectionDialog$.form)).isExisting(),
    })
  })

  test('locate PBC japanese subtitles file', async () => {
    const { app, client } = context

    await mockElectronHelpers(app, {
      showOpenDialog: [Promise.resolve([join(ASSETS_DIRECTORY, 'pbc_jp.ass')])],
    })

    await client.waitForText_(fileSelectionDialog$.form, 'pbc_jp.ass')
    await client.clickElement_(fileSelectionDialog$.filePathField)
    await client.clickElement_(fileSelectionDialog$.continueButton)
    await client.waitUntilGone_(fileSelectionDialog$.continueButton)
  })

  test('close subtitles menu', async () => {
    const { client } = context

    await client.clickElement('body')
    await client.waitUntilGone_(subtitlesMenu$.trackMenuItems)
  })

  test('fill in existing card with text from loaded subtitles via stretch', async () => {
    const { client } = context

    await waveformMouseDrag(client, 591, 572)

    await client.waitForText_(flashcardSection$.container, 'ああー  吸わないで')
  })
}
