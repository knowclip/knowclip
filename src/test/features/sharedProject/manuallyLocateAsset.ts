import { TestSetup, ASSETS_DIRECTORY } from '../../spectronApp'
import { testLabels as waveform } from '../../../components/Waveform'
import { testLabels as subtitlesMenu } from '../../../components/SubtitlesMenu'
import { testLabels as fileSelectionForm } from '../../../components/FileSelectionForm'
import { testLabels as confirmationDialog } from '../../../components/Dialog/Confirmation'
import { setVideoTime } from '../../driver/media'
import { dragMouse } from '../../driver/runEvents'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { testLabels as flashcardForm } from '../../../components/FlashcardSectionForm'

export default async function manuallyLocateAsset({ app, client }: TestSetup) {
  await client.clickElement_(subtitlesMenu.openMenuButton)

  await client.clickElement_(subtitlesMenu.openTrackSubmenuButton)

  await client.clickElement_(subtitlesMenu.locateExternalFileButton)

  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([join(ASSETS_DIRECTORY, 'pbc_jp.ass')])],
  })
  await client.clickElement_(fileSelectionForm.filePathField)
  await client.clickElement_(fileSelectionForm.continueButton)

  await client.clickElement('body')
  await client.waitUntilGone_(subtitlesMenu.trackMenuItems)

  await dragMouse(app, [591, 422], [572, 422])

  await client.waitForText_(flashcardForm.container, 'ああー  吸わないで')
}
