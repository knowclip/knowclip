import { TestSetup, ASSETS_DIRECTORY } from '../../spectronApp'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { fileSelectionForm$ } from '../../../components/Dialog/FileSelectionDialog'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { snackbar$ } from '../../../components/Snackbar'

export default async function openSharedProject({ app, client }: TestSetup) {
  await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
  console.log(await client.elements_(mediaFilesMenu$.mediaFileMenuItem))
  const [, secondMediaFile] = await client.elements_(
    mediaFilesMenu$.mediaFileMenuItem,
    2
  )
  await secondMediaFile.click()
  await client.clickElement_(fileSelectionForm$.cancelButton)

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
