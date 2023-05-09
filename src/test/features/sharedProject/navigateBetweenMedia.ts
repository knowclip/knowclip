import { IntegrationTestContext, ASSETS_DIRECTORY } from '../../setUpDriver'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { fileSelectionForm$ } from '../../../components/Dialog/FileSelectionDialog'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { snackbar$ } from '../../../components/Snackbar'

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
    await client.waitForVisible_(fileSelectionForm$.form)
    await client.waitForText_(
      fileSelectionForm$.form,
      'Please locate your media file "piggeldy_cat.mp4" in the filesystem so you can make clips with it.'
    )
  })

  test('cancel attempt to locate media file', async () => {
    const { client } = context

    await client.clickElement_(fileSelectionForm$.cancelButton)
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

    await client.waitForText_(fileSelectionForm$.form, 'polar_bear_cafe.mp4')
  })

  test('locate missing media file', async () => {
    const { app, client } = context

    await mockElectronHelpers(app, {
      showOpenDialog: [
        Promise.resolve([join(ASSETS_DIRECTORY, 'polar_bear_cafe.mp4')]),
      ],
    })
    await client.clickElement_(fileSelectionForm$.filePathField)
    await client.clickElement_(fileSelectionForm$.continueButton)
  })

  test('dismiss subtitles dialog and snackbar', async () => {
    const { client } = context

    await client.waitForText_(fileSelectionForm$.form, 'pbc_jp.ass')
    await client.clickElement_(fileSelectionForm$.cancelButton)
    await client.clickElement_(snackbar$.closeButton)
    await client.waitUntilGone_(snackbar$.closeButton)
  })
}
