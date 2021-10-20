import { testBlock, TestSetup } from '../../setUpDriver'
import { reviewAndExport$ as dialog$ } from '../../../components/ReviewAndExport'
import { reviewAndExportMediaTable$ as mediaTables$ } from '../../../components/ReviewAndExportMediaTable'
import {
  reviewAndExportMediaTableRow$ as mediaTableRows$,
  reviewAndExportMediaTableRow$,
} from '../../../components/ReviewAndExportMediaTableRow'
import { checkboxesChecked } from '../../driver/reviewAndExportDialog'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { projectMenu$ } from '../../../components/ProjectMenu'

export default async function reviewWithMissingMedia({ client }: TestSetup) {
  // maybe the first part for the loaded media should go in a different integration test
  await testBlock('open dialog with correct flashcard selected', async () => {
    await client.waitForText_(flashcardSection$.container, 'ああー  吸わないで')
    await client.clickElement_(projectMenu$.exportButton)
  })

  await testBlock(
    'continue to APKG Export view and check correct card is highlighted',
    async () => {
      await client.clickElement_(dialog$.continueButton)
      await client.elements_(mediaTables$.container, 2)
      await client.waitForText_(
        reviewAndExportMediaTableRow$.highlightedClipRow,
        'ああー  吸わないで'
      )
    }
  )

  await testBlock('first table checkbox is checked', async () => {
    expect(
      await checkboxesChecked(client, mediaTables$.checkbox)
    ).toMatchObject([true, false])
  })

  await testBlock('uncheck first checkbox', async () => {
    await client.clickElement_(mediaTableRows$.clipCheckboxes)
    expect(
      await checkboxesChecked(client, mediaTables$.checkbox)
    ).toMatchObject([false, false])
  })

  const [polarBearCafeCheckbox, piggeldyCheckbox] = await client.elements_(
    mediaTables$.checkbox
  )

  await testBlock('check all PBC checkboxes', async () => {

    await polarBearCafeCheckbox.click()
    expect(
      await checkboxesChecked(client, mediaTableRows$.clipCheckboxes)
    ).toMatchObject([true, true, true, true])
  })

  await testBlock('select first card via double-click', async () => {
    await client.waitForText_(
      mediaTableRows$.container,
      '笹を食べながらのんびりするのは最高だなぁ'
    )
    await client.doubleClickElement_(mediaTableRows$.container)
    await client.waitUntil(async () => {
      const row = await client.firstElement_(mediaTableRows$.container)
      const classNames = await row.getAttribute('className')
      return Boolean(
        classNames && classNames.includes(mediaTableRows$.highlightedClipRow)
      )
    })
  })

  await testBlock('open piggeldy table and select first piggeldy card', async () => {
    const [, piggeldyHeader] = await client.elements_(mediaTables$.header)
    piggeldyHeader.click()
    await client.waitUntilGone_(mediaTableRows$.highlightedClipRow)
    await client.doubleClickElement_(mediaTableRows$.container)
  })

  await testBlock('check all piggeldy checkboxes', async () => {
    expect(
      await checkboxesChecked(client, mediaTableRows$.clipCheckboxes)
    ).toMatchObject([false, false])
    await piggeldyCheckbox.click()
    expect(
      await checkboxesChecked(client, mediaTableRows$.clipCheckboxes)
    ).toMatchObject([true, true])
  })
}
