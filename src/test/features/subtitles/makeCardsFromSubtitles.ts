import { TestSetup, ASSETS_DIRECTORY, testBlock } from '../../setUpDriver'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { subtitleClipsDialog$ } from '../../../components/Dialog/SubtitlesClipsDialog'
import { waveform$ } from '../../../components/waveformTestLabels'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { flashcardSection$ } from '../../../components/FlashcardSection'

export default async function makeCardsFromSubtitles({
  app,
  client,
}: TestSetup) {
  await testBlock('open project', async () => {
    await client.clickElement_(projectsMenu$.recentProjectsListItem)
    await client.waitForText_(
      mediaFilesMenu$.openMediaFilesMenuButton,
      'piggeldy_cat.mp4'
    )
  })

  await testBlock('open PBC media file', async () => {
    await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
    await client.clickElement_(mediaFilesMenu$.mediaFileMenuItem)
    await client.waitForText_(
      mediaFilesMenu$.openMediaFilesMenuButton,
      'polar_bear_cafe.mp4'
    )
  })

  await testBlock('open subtitles menu', async () => {
    await client.clickElement_(subtitlesMenu$.openMenuButton)
    await client.waitForText_(subtitlesMenu$.container, 'pbc_jp.ass')
  })

  await testBlock('delete subtitles file pbc_jp.ass', async () => {
    await client.elementWithText_(subtitlesMenu$.trackMenuItems, 'pbc_jp.ass')

    const [, pbcTrackOpenSubmenuButton] = await client.elements_(
      subtitlesMenu$.openTrackSubmenuButton
    )
    // await client.clickElement_(subtitlesMenu$.openTrackSubmenuButton)
    await pbcTrackOpenSubmenuButton!.click()
    await client.clickElement_(subtitlesMenu$.deleteTrackButton)
    await client.waitUntilGone_(waveform$.subtitlesChunk)
  })

  await testBlock(
    'open dialog to generate clips and click button to load a subtitles track',
    async () => {
      await client.clickElement_(subtitlesMenu$.makeClipsAndCardsButton)
      await client.clickElement_(confirmationDialog$.okButton)

      await mockElectronHelpers(app, {
        showOpenDialog: [
          Promise.resolve([join(ASSETS_DIRECTORY, 'pbc_jp.ass')]),
        ],
      })
      await client.clickElement_(subtitleClipsDialog$.loadMoreTracksButton)
    }
  )

  await testBlock('link transcription field', async () => {
    await client.clickElement_(subtitleClipsDialog$.transcriptionField)
    const [, externalOption] = await client.elements_(
      subtitleClipsDialog$.selectFieldOption,
      2
    )
    externalOption.click()
    await client.waitUntilGone_(subtitleClipsDialog$.selectFieldOption)
  })

  await testBlock('link meaning field and submit', async () => {
    await client.clickElement_(subtitleClipsDialog$.meaningField)
    const [embeddedOption] = await client.elements_(
      subtitleClipsDialog$.selectFieldOption,
      2
    )
    embeddedOption.click()
    await client.waitUntilGone_(subtitleClipsDialog$.selectFieldOption)
    await client.clickElement_(subtitleClipsDialog$.okButton)
  })

  await testBlock('verify links', async () => {
    await client.waitForText_(
      flashcardSection$.container,
      '笹を食べながらのんびりするのは最高だなぁ'
    )
    await client.waitForText_(
      flashcardSection$.container,
      'Chilling and eating bamboo \ngrass is the best thing ever.'
    )
  })
}
