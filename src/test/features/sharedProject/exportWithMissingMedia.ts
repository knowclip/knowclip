import { TestSetup, ASSETS_DIRECTORY, TMP_DIRECTORY } from '../../spectronApp'
import { reviewAndExport$ as dialog$ } from '../../../components/ReviewAndExport'
import { reviewAndExportMediaTable$ as mediaTables$ } from '../../../components/ReviewAndExportMediaTable'
import { snackbar$ } from '../../../components/Snackbar'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { fileSelectionForm$ } from '../../../components/Dialog/FileSelectionDialog'
import { checkboxesChecked } from '../../driver/reviewAndExportDialog'
import { mainHeader$ } from '../../../components/MainHeader'

export default async function exportWithMissingMedia({
  client,
  app,
}: TestSetup) {
  const initialText = await client.getText_(dialog$.container)
  expect(await checkboxesChecked(client, mediaTables$.checkbox)).toEqual([
    true,
    true,
  ])
  await client.clickElement_(dialog$.exportApkgButton)

  await mockElectronHelpers(app, {
    showOpenDialog: [
      Promise.resolve([join(ASSETS_DIRECTORY, 'piggeldy_cat.mp4')]),
    ],
  })
  await client.clickElement_(fileSelectionForm$.filePathField)
  // await client.waitForText('body', join(ASSETS_DIRECTORY, 'piggeldy_cat.mp4'))
  await client.clickElement_(fileSelectionForm$.continueButton)
  await client.waitUntilGone_(fileSelectionForm$.container)

  await client.clickElement_(dialog$.continueButton)
  const mediaCheckboxesChecked = await checkboxesChecked(
    client,
    mediaTables$.checkbox
  )
  expect(mediaCheckboxesChecked).toEqual([true, true])

  expect(initialText).toEqual(await client.getText_(dialog$.container))

  await mockElectronHelpers(app, {
    showSaveDialog: [
      Promise.resolve(join(TMP_DIRECTORY, 'deck_from_shared_project.apkg')),
    ],
  })
  await client.clickElement_(dialog$.exportApkgButton)

  await client.waitForText('body', 'Flashcards made in ')
  await client.clickElement_(snackbar$.closeButton)
  await client.waitUntilGone_(snackbar$.closeButton)

  await client.clickElement_(dialog$.exitButton)
  await client.waitUntilGone_(dialog$.exitButton)

  await client.waitForText_(mainHeader$.container, 'polar_bear_cafe.mp4')
}
