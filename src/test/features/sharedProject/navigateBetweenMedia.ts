import { IntegrationTestContext, ASSETS_DIRECTORY } from '../../setUpDriver'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu.testLabels'
import { fileSelectionDialog$ } from '../../../components/Dialog/FileSelectionDialog.testLabels'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { snackbar$ } from '../../../components/Snackbar.testLabels'
import { test } from '../../test'

export default async function navigateBetweenMedia(
  context: IntegrationTestContext
) {
  test('click second item in media files menu', async () => {
    const { client } = context

    await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
    const [, secondMediaFile] = await client.elements_(
      mediaFilesMenu$.mediaFileMenuItem,
      2
    )
    await secondMediaFile.click()
    await client.waitForVisible_(fileSelectionDialog$.form)
    await client.waitForText_(
      fileSelectionDialog$.form,
      'Please locate your media file "piggeldy_cat.mp4" in the filesystem so you can make clips with it.'
    )
  })

  test('cancel attempt to locate media file', async () => {
    const { client } = context

    await client.clickElement_(fileSelectionDialog$.cancelButton)
    await client.waitForVisible_(snackbar$.container)
    await client.waitForText_(
      snackbar$.container,
      'Could not locate media file "piggeldy_cat.mp4". Some features may be unavailable until it is located.'
    )
  })
  test('close snackbar after cancelling location attempt', async () => {
    const { client } = context

    await client.clickElement_(snackbar$.closeButton)
    await client.waitUntilGone_(snackbar$.closeButton)
  })

  test('open first item in media files menu', async () => {
    const { client } = context

    await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
    const [firstMediaFile] = await client.elements_(
      mediaFilesMenu$.mediaFileMenuItem
    )
    await firstMediaFile.click()

    await client.waitForText_(fileSelectionDialog$.form, 'polar_bear_cafe.mp4')
  })

  test('locate missing media file', async () => {
    const { app, client } = context

    await mockElectronHelpers(app, {
      showOpenDialog: [
        Promise.resolve([join(ASSETS_DIRECTORY, 'polar_bear_cafe.mp4')]),
      ],
    })
    await client.clickElement_(fileSelectionDialog$.filePathField)
    await client.clickElement_(fileSelectionDialog$.continueButton)
  })

  test('dismiss subtitles dialog', async () => {
    const { client } = context

    await client._driver.client
      .$(`#${fileSelectionDialog$.form}*=pbc_jp.ass`)
      .isExisting()
    await client.clickElement_(fileSelectionDialog$.cancelButton)
  })

  test('dismiss subtitles snackbar', async () => {
    const { client } = context
    await client.clickElement_(snackbar$.closeButton)
    await client.waitUntilGone_(snackbar$.closeButton)
  })
}
