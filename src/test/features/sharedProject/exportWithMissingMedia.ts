import { IntegrationTestContext, ASSETS_DIRECTORY } from '../../setUpDriver'
import { reviewAndExport$ as dialog$ } from '../../../components/ReviewAndExport.testLabels'
import { reviewAndExportMediaTable$ as mediaTables$ } from '../../../components/ReviewAndExportMediaTable.testLabels'
import { snackbar$ } from '../../../components/Snackbar.testLabels'
import { join } from 'path'
import { mockElectronHelpers } from '../../mockElectronHelpers'
import { fileSelectionDialog$ } from '../../../components/Dialog/FileSelectionDialog.testLabels'
import { checkboxesChecked } from '../../driver/reviewAndExportDialog'
import { mainHeader$ } from '../../../components/MainHeader.testLabels'
import * as yauzl from 'yauzl'
import * as fs from 'fs'
import { test, expect } from '../../test'

export default async function exportWithMissingMedia(
  context: IntegrationTestContext
) {
  test('select clips to export', async () => {
    const { client } = context

    expect(await checkboxesChecked(client, mediaTables$.checkbox)).toEqual([
      true,
      true,
    ])
  })
  test('find missing media after prompted', async () => {
    const { app, client } = context
    const apkgFilePath = join(
      context.temporaryDirectory,
      'deck_from_shared_project.apkg'
    )

    const initialText = await client.getText_(dialog$.container)
    await client.clickElement_(dialog$.exportApkgButton)

    await mockElectronHelpers(app, {
      showOpenDialog: [
        Promise.resolve([join(ASSETS_DIRECTORY, 'piggeldy_cat.mp4')]),
      ],
    })
    await client.clickElement_(fileSelectionDialog$.filePathField)
    await client.clickElement_(fileSelectionDialog$.continueButton)
    await client.waitUntilGone_(fileSelectionDialog$.form)

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
    const outPath = join(context.temporaryDirectory, 'zipout')
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
            readStream?.pipe(
              fs.createWriteStream(join(outPath, entry.fileName))
            )
          })
        })
      })
    })

    expect(files).toMatchObject([
      ...[...Array(12).keys()].map((k) => k.toString()),
      'media',
      'collection.anki2',
    ])
  })
}
