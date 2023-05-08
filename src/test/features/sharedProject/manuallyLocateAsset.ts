import { TestSetup, ASSETS_DIRECTORY, testBlock } from '../../setUpDriver'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu'
import { fileSelectionForm$ } from '../../../components/Dialog/FileSelectionDialog'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { waveformMouseHoldAndDrag } from '../../driver/waveform'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { getSelector } from '../../driver/ClientWrapper'

export default async function manuallyLocateAsset({ app, client }: TestSetup) {
  await testBlock('go to locate external subtitles file in menu', async () => {
    await client.clickElement_(subtitlesMenu$.openMenuButton)

    // should expect second menu item has text "pbc_jp.ass"
    const [, pbcJpOpenTrackSubmenuButton] = await client.elements_(
      subtitlesMenu$.openTrackSubmenuButton
    )
    pbcJpOpenTrackSubmenuButton.click()

    do {
      await client.clickElement_(subtitlesMenu$.locateExternalFileButton)
    } while (
      !(await app.client.$(getSelector(fileSelectionForm$.form)).isExisting())
    )
  })

  await testBlock('locate PBC japanese subtitles file', async () => {
    await mockElectronHelpers(app, {
      showOpenDialog: [Promise.resolve([join(ASSETS_DIRECTORY, 'pbc_jp.ass')])],
    })

    await client.waitForText_(fileSelectionForm$.form, 'pbc_jp.ass')
    await client.clickElement_(fileSelectionForm$.filePathField)
    await client.clickElement_(fileSelectionForm$.continueButton)
    await client.waitUntilGone_(fileSelectionForm$.continueButton)
  })

  await testBlock('close subtitles menu', async () => {
    await client.clickElement('body')
    await client.waitUntilGone_(subtitlesMenu$.trackMenuItems)
  })

  await testBlock(
    'fill in existing card with text from loaded subtitles via stretch',
    async () => {
      await waveformMouseHoldAndDrag(client, 300, 591, 572)

      await client.waitForText_(
        flashcardSection$.container,
        'ああー  吸わないで'
      )
    }
  )
}
