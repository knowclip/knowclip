import { TestSetup, ASSETS_DIRECTORY } from '../../spectronApp'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { flashcardSectionForm$ } from '../../../components/FlashcardSectionForm'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { subtitleClipsDialog$ } from '../../../components/Dialog/SubtitlesClipsDialog'
import { waveform$ } from '../../../components/Waveform'

export default async function makeCardsFromSubtitles({
  app,
  client,
}: TestSetup) {
  await client.clickElement_(projectsMenu$.recentProjectsListItem)

  await client.clickElement_(subtitlesMenu$.openMenuButton)
  await client.clickElement_(subtitlesMenu$.openTrackSubmenuButton)
  await client.clickElement_(subtitlesMenu$.deleteTrackButton)
  await client.elements_(waveform$.subtitlesTimelines, 1)

  await client.clickElement_(subtitlesMenu$.makeClipsAndCardsButton)
  await client.clickElement_(confirmationDialog$.okButton)

  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([join(ASSETS_DIRECTORY, 'pbc_jp.ass')])],
  })
  await client.clickElement_(subtitleClipsDialog$.loadMoreTracksButton)

  await client.clickElement_(subtitleClipsDialog$.transcriptionField)
  const [, externalOption] = await client.elements_(
    subtitleClipsDialog$.selectFieldOption
  )
  externalOption.click()
  await client.waitUntilGone_(subtitleClipsDialog$.selectFieldOption)

  await client.clickElement_(subtitleClipsDialog$.meaningField)
  const [embeddedOption] = await client.elements_(
    subtitleClipsDialog$.selectFieldOption
  )
  embeddedOption.click()
  await client.waitUntilGone_(subtitleClipsDialog$.selectFieldOption)
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
