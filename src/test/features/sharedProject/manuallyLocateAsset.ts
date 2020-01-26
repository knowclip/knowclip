import { TestSetup, ASSETS_DIRECTORY } from '../../spectronApp'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu'
import { fileSelectionForm$ } from '../../../components/FileSelectionForm'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { flashcardSectionForm$ as flashcardForm$ } from '../../../components/FlashcardSectionForm'
import { waveformMouseDrag } from '../../driver/waveform'

export default async function manuallyLocateAsset({ app, client }: TestSetup) {
  await client.clickElement_(subtitlesMenu$.openMenuButton)

  await client.clickElement_(subtitlesMenu$.openTrackSubmenuButton)

  await client.clickElement_(subtitlesMenu$.locateExternalFileButton)

  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([join(ASSETS_DIRECTORY, 'pbc_jp.ass')])],
  })
  await client.clickElement_(fileSelectionForm$.filePathField)
  await client.clickElement_(fileSelectionForm$.continueButton)

  await client.clickElement('body')
  await client.waitUntilGone_(subtitlesMenu$.trackMenuItems)

  await waveformMouseDrag(app, client, 591, 572)

  await client.waitForText_(flashcardForm$.container, 'ああー  吸わないで')
}
