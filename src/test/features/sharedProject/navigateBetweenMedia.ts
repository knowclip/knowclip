import { TestSetup, ASSETS_DIRECTORY } from '../../spectronApp'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesMenu'
import { testLabels as fileSelectionForm } from '../../../components/FileSelectionForm'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'

export default async function openSharedProject({ app, client }: TestSetup) {
  await client.clickElement_(mediaFilesMenu.openMediaFilesMenuButton)
  const [, secondMediaFile] = await client.elements_(
    mediaFilesMenu.mediaFileMenuItem
  )
  await secondMediaFile.click()

  await client.waitForText_(fileSelectionForm.container, 'polar_bear_cafe.mp4')

  await mockElectronHelpers(app, {
    showOpenDialog: [
      Promise.resolve([join(ASSETS_DIRECTORY, 'polar_bear_cafe.mp4')]),
    ],
  })
  await client.clickElement_(fileSelectionForm.filePathField)
  await client.clickElement_(fileSelectionForm.continueButton)

  await client.waitForText_(fileSelectionForm.container, 'pbc_jp.ass')
  await client.clickElement_(fileSelectionForm.cancelButton)
}
