import { TestSetup, ASSETS_DIRECTORY } from '../../spectronApp'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu'
import { fileSelectionForm$ } from '../../../components/FileSelectionForm'
import { dragMouse } from '../../driver/runEvents'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import {
  flashcardSectionForm$ as flashcardForm$,
  flashcardSectionForm$,
} from '../../../components/FlashcardSectionForm'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { subtitleClipsDialog$ } from '../../../components/Dialog/SubtitlesClipsDialog'

export default async function makeCardsFromSubtitles({
  app,
  client,
}: TestSetup) {
  await client.clickElement_(projectsMenu$.recentProjectsListItem)
  await client.clickElement_(fileSelectionForm$.cancelButton)

  await client.clickElement_(subtitlesMenu$.openMenuButton)

  await client.clickElement_(subtitlesMenu$.makeClipsAndCardsButton)
  await client.clickElement_(confirmationDialog$.okButton)

  await client.clickElement_(subtitleClipsDialog$.okButton)

  await client.clickElement_(fileSelectionForm$.cancelButton)

  await client.clickElement_(subtitleClipsDialog$.okButton)

  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([join(ASSETS_DIRECTORY, 'pbc_jp.ass')])],
  })
  await client.clickElement_(fileSelectionForm$.filePathField)
  await client.clickElement_(fileSelectionForm$.continueButton)

  await client.clickElement_(subtitleClipsDialog$.okButton)

  await client.waitForText_(
    flashcardSectionForm$.container,
    '笹を食べながらのんびりするのは最高だなぁ'
  )
  await client.waitForText_(
    flashcardSectionForm$.container,
    'Chilling and eating bamboo \ngrass is the best thing ever.'
  )
}
