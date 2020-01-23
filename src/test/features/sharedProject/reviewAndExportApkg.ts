import { TestSetup, TMP_DIRECTORY } from '../../spectronApp'
import { main$ } from '../../../components/Main'
import { reviewAndExport$ as dialog$ } from '../../../components/ReviewAndExport'
import { reviewAndExportMediaTable$ as dialogTable$ } from '../../../components/ReviewAndExportMediaTable'
import { reviewAndExportMediaTableRow$ as dialogTableRow$ } from '../../../components/ReviewAndExportMediaTableRow'
import { snackbar$ } from '../../../components/Snackbar'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { fileSelectionForm$ } from '../../../components/FileSelectionForm'

export default async function reviewAndExportApkg({ client, app }: TestSetup) {
  await client.clickElement_(main$.exportButton)

  await client.clickElement_(dialog$.continueButton)

  await client.elements(dialogTable$.container, 2)
  await client.clickElement_(dialogTable$.checkbox)

  const mediaFileCheckboxInputs = await client.elements_(
    `${dialogTable$.checkbox} input`
  )
  const checkboxesChecked = await Promise.all(
    mediaFileCheckboxInputs.map(mediaFile => mediaFile.isSelected())
  )
  expect(checkboxesChecked).toMatchObject([true, true])

  await client.waitForText_(
    fileSelectionForm$.filePathField,
    'Please locate your media file "piggeldy_cat.mp4"'
  )
  await mockElectronHelpers(app, {
    showSaveDialog: [
      Promise.resolve(join(TMP_DIRECTORY, 'deck_from_shared_project.apkg')),
    ],
  })
  await client.clickElement_(fileSelectionForm$.filePathField)
  await client.clickElement_(fileSelectionForm$.continueButton)

  const [first, , third] = await client.elements_(
    dialogTableRow$.clipCheckboxes
  )

  // await first.click()
  // await first.click()
  // await third.click()

  // const checkboxInputs = await client.elements_(
  //   `${dialogTableRow$.clipCheckboxes} input`
  // )
  // const checkboxesChecked = async () =>
  //   await Promise.all(checkboxInputs.map(cbi => cbi.isSelected()))

  // expect(await checkboxesChecked()).toMatchObject([true, true, false])

  // await mockElectronHelpers(app, {
  //   showSaveDialog: [
  //     Promise.resolve(join(TMP_DIRECTORY, 'deck_from_new_project.apkg')),
  //   ],
  // })
  // await client.clickElement_(dialog$.exportApkgButton)

  // await client.waitForText('body', 'Flashcards made in ')
  // await client.clickElement_(snackbar$.closeButton)
  // await client.waitUntilGone_(snackbar$.closeButton)

  // await client.clickElement_(dialog$.exitButton)
  // await client.waitUntilGone_(dialog$.exitButton)
}
