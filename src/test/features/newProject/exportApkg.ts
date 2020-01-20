import { TestSetup, TMP_DIRECTORY } from '../../setup'
import { testLabels as main } from '../../../components/Main'
import { testLabels as dialog } from '../../../components/ReviewAndExport'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function navigateBetweenMedia({
  $_,
  $$_,
  client,
  app,
}: TestSetup) {
  await $_(main.exportButton).click()

  await $_(dialog.continueButton).click()
  await client.waitUntil(
    async () => [...(await $$_(dialog.clipCheckboxes))].length === 3
  )
  const clipCheckboxes = await $$_(dialog.clipCheckboxes)

  await client.elementIdClick(clipCheckboxes[0].value.ELEMENT)
  await client.elementIdClick(clipCheckboxes[0].value.ELEMENT)
  await client.elementIdClick(clipCheckboxes[2].value.ELEMENT)

  const checkboxesChecked = await Promise.all(
    (await $$_(dialog.clipCheckboxes)).map(
      async el =>
        await client.elementIdElement(el.value.ELEMENT, 'input').isSelected()
    )
  )
  expect(checkboxesChecked).toMatchObject([true, true, false])

  await mockElectronHelpers(app, {
    showSaveDialog: [
      Promise.resolve(join(TMP_DIRECTORY, 'deck_from_new_project.apkg')),
    ],
  })
  await $_(dialog.exportApkgButton).click()

  await client.waitUntilTextExists('body', 'Flashcards made in ')

  await $_(dialog.exitButton).click()
}
