import { TestSetup, mockElectronHelpers, TMP_DIRECTORY } from '../../setup'
import { testLabels as main } from '../../../components/Main'
import { testLabels as dialog } from '../../../components/ReviewAndExport'
import { join } from 'path'

export default async function navigateBetweenMedia({
  $_,
  $$_,
  client,
  app,
}: TestSetup) {
  await $_(main.exportButton).click()

  await $_(dialog.continueButton).click()

  await mockElectronHelpers(app, {
    showSaveDialog: Promise.resolve(
      join(TMP_DIRECTORY, 'deck_from_new_project.apkg')
    ),
  })

  await $_(dialog.exportApkgButton).click()

  await client.waitUntilTextExists('body', 'Flashcards made in ')
}
