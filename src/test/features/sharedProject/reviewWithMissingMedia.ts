import { TestSetup } from '../../spectronApp'
import { main$ } from '../../../components/Main'
import { reviewAndExport$ as dialog$ } from '../../../components/ReviewAndExport'
import { reviewAndExportMediaTable$ as mediaTables$ } from '../../../components/ReviewAndExportMediaTable'
import {
  reviewAndExportMediaTableRow$ as mediaTableRows$,
  reviewAndExportMediaTableRow$,
} from '../../../components/ReviewAndExportMediaTableRow'
import { flashcardSectionForm$ } from '../../../components/FlashcardSectionForm'
import { checkboxesChecked } from '../../driver/reviewAndExportDialog'

export default async function reviewWithMissingMedia({ client }: TestSetup) {
  // maybe the first part for the loaded media should go in a different integration test
  await client.waitForText_(
    flashcardSectionForm$.container,
    'ああー  吸わないで'
  )
  await client.clickElement_(main$.exportButton)

  await client.clickElement_(dialog$.continueButton)
  await client.elements_(mediaTables$.container, 2)
  await client.waitForText_(
    reviewAndExportMediaTableRow$.highlightedClipRow,
    'ああー  吸わないで'
  )

  expect(await checkboxesChecked(client, mediaTables$.checkbox)).toMatchObject([
    false,
    true,
  ])
  await client.clickElement_(mediaTableRows$.clipCheckboxes)
  expect(await checkboxesChecked(client, mediaTables$.checkbox)).toMatchObject([
    false,
    false,
  ])

  const [firstMediaCheckbox, secondMediaCheckbox] = await client.elements_(
    mediaTables$.checkbox
  )
  await secondMediaCheckbox.click()
  expect(await checkboxesChecked(client, mediaTables$.checkbox)).toMatchObject([
    false,
    true,
  ])

  await client.clickElement_(mediaTableRows$.clipCheckboxes)
  expect(
    await checkboxesChecked(client, mediaTableRows$.clipCheckboxes)
  ).toMatchObject([false, true, true, true])

  await client.clickElement_(mediaTableRows$.container)
  await client.waitForText_(
    mediaTableRows$.highlightedClipRow,
    '笹を食べながらのんびりするのは最高だなぁ'
  )

  await client.clickElement_(mediaTables$.header)
  await client.waitUntilGone_(mediaTableRows$.highlightedClipRow)
  await client.clickElement_(mediaTableRows$.container)

  expect(
    await checkboxesChecked(client, mediaTableRows$.clipCheckboxes)
  ).toMatchObject([false, false, false])
  await firstMediaCheckbox.click()
  expect(
    await checkboxesChecked(client, mediaTableRows$.clipCheckboxes)
  ).toMatchObject([true, true, true])
}
