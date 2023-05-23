import { IntegrationTestContext } from '../../setUpDriver'
import { reviewAndExport$ as dialog$ } from '../../../components/ReviewAndExport.testLabels'
import { reviewAndExportMediaTable$ as mediaTables$ } from '../../../components/ReviewAndExportMediaTable.testLabels'
import { reviewAndExportMediaTableRow$ as mediaTableRows$ } from '../../../components/ReviewAndExportMediaTableRow.testLabels'
import { checkboxesChecked } from '../../driver/reviewAndExportDialog'
import { flashcardSection$ } from '../../../components/FlashcardSection.testLabels'
import { projectMenu$ } from '../../../components/ProjectMenu.testLabels'
import { test, expect } from '../../test'

export default async function reviewWithMissingMedia(
  context: IntegrationTestContext
) {
  // maybe the first part for the loaded media should go in a different integration test
  test('open dialog with correct flashcard selected', async () => {
    const { client } = context

    await client.waitForText_(flashcardSection$.container, 'ああー  吸わないで')
    await client.clickElement_(projectMenu$.exportButton)
  })

  test('continue to APKG Export view and check correct card is highlighted', async () => {
    const { client } = context

    await client.clickElement_(dialog$.continueButton)
    await client.elements_(mediaTables$.container, 2)
    await client.waitForText_(
      mediaTableRows$.highlightedClipRow,
      'ああー  吸わないで'
    )
  })

  test('first table checkbox is checked', async () => {
    const { client } = context

    expect(
      await checkboxesChecked(client, mediaTables$.checkbox)
    ).toMatchObject([true, false])
  })

  test('uncheck first checkbox', async () => {
    const { client } = context

    await client.clickElement_(mediaTableRows$.clipCheckboxes)
    expect(
      await checkboxesChecked(client, mediaTables$.checkbox)
    ).toMatchObject([false, false])
  })

  test('check all PBC checkboxes', async () => {
    const { client } = context
    const [polarBearCafeCheckbox, _piggeldyCheckbox] = await client.elements_(
      mediaTables$.checkbox
    )
    await polarBearCafeCheckbox.click()
    expect(
      await checkboxesChecked(client, mediaTableRows$.clipCheckboxes)
    ).toMatchObject([true, true, true, true])
  })

  test('select first card via double-click', async () => {
    const { client } = context

    const firstCardText = '笹を食べながらのんびりするのは最高だなぁ'
    await client.waitForText_(mediaTableRows$.container, firstCardText)
    await client.doubleClickElement_(mediaTableRows$.container)

    await client.waitForText_(mediaTableRows$.highlightedClipRow, firstCardText)
  })

  test('open piggeldy table and select first piggeldy card', async () => {
    const { client } = context

    const [, piggeldyHeader] = await client.elements_(mediaTables$.header)
    piggeldyHeader.click()
    await client.waitUntilGone_(mediaTableRows$.highlightedClipRow)
    await client.doubleClickElement_(mediaTableRows$.container)
  })

  test('check all piggeldy checkboxes', async () => {
    const { client } = context
    const [_polarBearCafeCheckbox, piggeldyCheckbox] = await client.elements_(
      mediaTables$.checkbox
    )
    expect(
      await checkboxesChecked(client, mediaTableRows$.clipCheckboxes)
    ).toMatchObject([false, false])
    await piggeldyCheckbox.click()
    expect(
      await checkboxesChecked(client, mediaTableRows$.clipCheckboxes)
    ).toMatchObject([true, true])
  })
}
