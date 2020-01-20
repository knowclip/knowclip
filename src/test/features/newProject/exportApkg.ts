import { TestSetup, TMP_DIRECTORY } from '../../setup'
import { testLabels as main } from '../../../components/Main'
import { testLabels as dialog } from '../../../components/ReviewAndExport'
import { testLabels as snackbar } from '../../../components/Snackbar'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function navigateBetweenMedia({
  clientWrapper,
  app,
}: TestSetup) {
  await clientWrapper.clickElement_(main.exportButton)

  await clientWrapper.clickElement_(dialog.continueButton)

  const [first, , third] = await clientWrapper.elements_(dialog.clipCheckboxes)

  await first.click()
  await first.click()
  await third.click()

  const checkboxInputs = await clientWrapper.elements_(
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
  await clientWrapper.clickElement_(dialog.exportApkgButton)

  await clientWrapper.waitForText('body', 'Flashcards made in ')
  await clientWrapper.clickElement_(snackbar.closeButton)

  await clientWrapper.clickElement_(dialog.exitButton)
}
