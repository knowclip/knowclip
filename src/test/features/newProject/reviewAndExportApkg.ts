import { IntegrationTestContext, TMP_DIRECTORY } from '../../setUpDriver'
import { reviewAndExport$ as dialog$ } from '../../../components/ReviewAndExport.testLabels'
import { reviewAndExportMediaTableRow$ as dialogTableRow$ } from '../../../components/ReviewAndExportMediaTableRow.testLabels'
import { snackbar$ } from '../../../components/Snackbar.testLabels'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { projectMenu$ } from '../../../components/ProjectMenu.testLabels'
import { ClientWrapper } from '../../driver/ClientWrapper'
import { retryUntil } from '../../driver/retryUntil'
import { test } from '../../test'

export default async function reviewAndExportApkg(
  context: IntegrationTestContext
) {
  test('select clips for export', async () => {
    const { client } = context
    await client.clickElement_(projectMenu$.exportButton)

    await client.clickElement_(dialog$.continueButton)

    const [first] = await client.elements_(
      `${dialogTableRow$.clipCheckboxes}`,
      3
    )

    await first.click()
    await first.click()
    const [, , third] = await client.elements_(
      `${dialogTableRow$.clipCheckboxes}`,
      3
    )

    await retryUntil({
      action: () => third.click(),
      conditionName: 'third checkbox is unchecked',
      check: async () =>
        (await checkboxesChecked(client)).join(' ') === `true true false`,
    })
  })
  test('export clips', async () => {
    const { app, client } = context
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
  })
}

async function checkboxesChecked(client: ClientWrapper) {
  const checkboxInputs = await client.elements_(
    `${dialogTableRow$.clipCheckboxes} input`,
    3
  )

  return await Promise.all(checkboxInputs.map((cbi) => cbi.isSelected()))
}
