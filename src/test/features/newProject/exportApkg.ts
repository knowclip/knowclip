import { TestSetup, TMP_DIRECTORY } from '../../setup'
import { testLabels as main } from '../../../components/Main'
import { testLabels as dialog } from '../../../components/ReviewAndExport'
import { testLabels as snackbar } from '../../../components/Snackbar'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function navigateBetweenMedia({
  client,
  app,
}: TestSetup) {
  await client.clickElement_(main.exportButton)

  await client.clickElement_(dialog.continueButton)

  const [first, , third] = await client.elements_(dialog.clipCheckboxes)

  await first.click()
  await first.click()
  await third.click()

  const checkboxInputs = await client.elements_(
    `${dialog.clipCheckboxes} input`
  )
  const checkboxesChecked = async () =>
    await Promise.all(checkboxInputs.map(cbi => cbi.isSelected()))

  expect(await checkboxesChecked()).toMatchObject([true, true, false])

  await mockElectronHelpers(app, {
    showSaveDialog: [
      Promise.resolve(join(TMP_DIRECTORY, 'deck_from_new_project.apkg')),
    ],
  })
  await client.clickElement_(dialog.exportApkgButton)

  await client.waitForText('body', 'Flashcards made in ')
  await client.clickElement_(snackbar.closeButton)

  await client.clickElement_(dialog.exitButton)
}
