import { TestSetup, TMP_DIRECTORY } from '../../setUpDriver'
import { reviewAndExport$ as dialog$ } from '../../../components/ReviewAndExport'
import { reviewAndExportMediaTableRow$ as dialogTableRow$ } from '../../../components/ReviewAndExportMediaTableRow'
import { snackbar$ } from '../../../components/Snackbar'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { projectMenu$ } from '../../../components/ProjectMenu'
import { ClientWrapper } from '../../driver/ClientWrapper'

export default async function reviewAndExportApkg({ client, app }: TestSetup) {
  await client.clickElement_(projectMenu$.exportButton)

  await client.clickElement_(dialog$.continueButton)

  const [first] = await client.elements_(`${dialogTableRow$.clipCheckboxes}`, 3)

  await first.click()
  await first.click()
  const [, , third] = await client.elements_(
    `${dialogTableRow$.clipCheckboxes}`,
    3
  )
  await third.click()

  client.waitUntil(async () => {
    return (await checkboxesChecked(client)).join(' ') === `true true false`
  })
  expect(await checkboxesChecked(client)).toMatchObject([true, true, false])

  await mockElectronHelpers(app, {
    showSaveDialog: [
      Promise.resolve(join(TMP_DIRECTORY, 'deck_from_new_project.apkg')),
    ],
  })
  await client.clickElement_(dialog$.exportApkgButton)

  await client.waitForText_(snackbar$.container, 'Flashcards made in ')
  await client.clickElement_(snackbar$.closeButton)
  await client.waitUntilGone_(snackbar$.closeButton)

  await client.clickElement_(dialog$.exitButton)
  await client.waitUntilGone_(dialog$.exitButton)
}

async function checkboxesChecked(client: ClientWrapper) {
  const checkboxInputs = await client.elements_(
    `${dialogTableRow$.clipCheckboxes} input`,
    3
  )

  return await Promise.all(checkboxInputs.map((cbi) => cbi.isSelected()))
}
