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

    await retryUntil({
      action: () =>
        client.clickElement_(subtitlesMenu$.locateExternalFileButton),
      conditionName: 'file selection form appears',
      check: () =>
        app.client.$(getSelector(fileSelectionForm$.form)).isExisting(),
    })
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

/** after mui v5,
 * clicking the file selection menu item
 * started failing, but only sometimes
 */
async function retryUntil({
  attemptsCount = 50,
  action,
  check,
  conditionName,
}: {
  attemptsCount?: number
  action: () => Promise<void>
  check: () => Promise<boolean>
  conditionName: string
}) {
  let attemptsMade = 0
  do {
    await action()
    attemptsMade += 1
    if (await check()) return
  } while (attemptsMade < attemptsCount)

  throw new Error(
    `Tried ${attemptsMade} times, but condition ${JSON.stringify(
      conditionName
    )} was never met`
  )
}
