import { TestSetup, ASSETS_DIRECTORY, TMP_DIRECTORY } from '../../setUpDriver'
import { reviewAndExport$ as dialog$ } from '../../../components/ReviewAndExport'
import { reviewAndExportMediaTable$ as mediaTables$ } from '../../../components/ReviewAndExportMediaTable'
import { snackbar$ } from '../../../components/Snackbar'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { fileSelectionForm$ } from '../../../components/Dialog/FileSelectionDialog'
import { checkboxesChecked } from '../../driver/reviewAndExportDialog'
import { mainHeader$ } from '../../../components/MainHeader'
import * as yauzl from 'yauzl'
import * as fs from 'fs'

export default async function exportWithMissingMedia({
  client,
  app,
}: TestSetup) {
  const apkgFilePath = join(TMP_DIRECTORY, 'deck_from_shared_project.apkg')

  const initialText = await client.getText_(dialog$.container)
  expect(await checkboxesChecked(client, mediaTables$.checkbox)).toEqual([
    true,
    true,
  ])
  await client.clickElement_(dialog$.exportApkgButton)

  await mockElectronHelpers(app, {
    showOpenDialog: [
      Promise.resolve([join(ASSETS_DIRECTORY, 'piggeldy_cat.mp4')]),
    ],
  })
  await client.clickElement_(fileSelectionForm$.filePathField)
  await client.clickElement_(fileSelectionForm$.continueButton)
  await client.waitUntilGone_(fileSelectionForm$.container)

  await client.clickElement_(dialog$.continueButton)
  const mediaCheckboxesChecked = await checkboxesChecked(
    client,
    mediaTables$.checkbox
  )
  expect(mediaCheckboxesChecked).toEqual([true, true])

  expect(initialText).toEqual(await client.getText_(dialog$.container))

  await mockElectronHelpers(app, {
    showSaveDialog: [Promise.resolve(apkgFilePath)],
  })
  await client.clickElement_(dialog$.exportApkgButton)

  await client.waitForText('body', 'Flashcards made in ')
  await client.clickElement_(snackbar$.closeButton)
  await client.waitUntilGone_(snackbar$.closeButton)

  await client.clickElement_(dialog$.exitButton)
  await client.waitUntilGone_(dialog$.exitButton)

  await client.waitForText_(mainHeader$.container, 'polar_bear_cafe.mp4')

  const files: string[] = []
  const outPath = join(TMP_DIRECTORY, 'zipout')
  if (!fs.existsSync(outPath)) fs.mkdirSync(outPath)
  await new Promise((res, rej) => {
    yauzl.open(apkgFilePath, (err, zipfile) => {
      zipfile?.on('end', res)
      if (err) return rej(err)
      if (!zipfile) return rej(err)
      zipfile.on('error', function (err) {
        throw err
      })
      zipfile.on('entry', function (entry) {
        // console.log(entry)
        // console.log(entry.getLastModDate())
        files.push(entry.fileName)
        zipfile.openReadStream(entry, function (err, readStream) {
          if (err) throw err
          readStream?.pipe(fs.createWriteStream(join(outPath, entry.fileName)))
        })
      })
    })
  })

  expect(files).toMatchObject([
    ...[...Array(12).keys()].map((k) => k.toString()),
    'media',
    'collection.anki2',
  ])
}
