import { TestSetup, ASSETS_DIRECTORY } from '../../setUpDriver'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { fileSelectionForm$ } from '../../../components/Dialog/FileSelectionDialog'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { snackbar$ } from '../../../components/Snackbar'

export default async function navigateBetweenMedia({ app, client }: TestSetup) {
  await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
  const [, secondMediaFile] = await client.elements_(
    mediaFilesMenu$.mediaFileMenuItem,
    2
  )
  await secondMediaFile.click()
  await client.waitForText_(
    fileSelectionForm$.container,
    'Please locate your media file "piggeldy_cat.mp4" in the filesystem so you can make clips with it.'
  )
  await client.clickElement_(fileSelectionForm$.cancelButton)

  await client.waitForText_(
    snackbar$.container,
    'Could not locate media file "piggeldy_cat.mp4". Some features may be unavailable until it is located.'
  )
  await client.clickElement_(snackbar$.closeButton)
  await client.waitUntilGone_(snackbar$.closeButton)

  await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
  const [firstMediaFile] = await client.elements_(
    mediaFilesMenu$.mediaFileMenuItem
  )
  await firstMediaFile.click()

  await client.waitForText_(fileSelectionForm$.container, 'polar_bear_cafe.mp4')

  await mockElectronHelpers(app, {
    showOpenDialog: [
      Promise.resolve([join(ASSETS_DIRECTORY, 'polar_bear_cafe.mp4')]),
    ],
  })
  await client.clickElement_(fileSelectionForm$.filePathField)
  await client.clickElement_(fileSelectionForm$.continueButton)

  await client.waitForText_(fileSelectionForm$.container, 'pbc_jp.ass')
  await client.clickElement_(fileSelectionForm$.cancelButton)
  await client.clickElement_(snackbar$.closeButton)
  await client.waitUntilGone_(snackbar$.closeButton)
}
