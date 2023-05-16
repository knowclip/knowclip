import { IntegrationTestContext, ASSETS_DIRECTORY } from '../../setUpDriver'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { projectsMenu$ } from '../../../components/ProjectsMenu'
import { confirmationDialog$ } from '../../../components/Dialog/Confirmation'
import { subtitleClipsDialog$ } from '../../../components/Dialog/SubtitlesClipsDialog'
import { waveform$ } from '../../../components/waveformTestLabels'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { retryUntil } from '../../driver/retryUntil'
import { getSelector } from '../../driver/ClientWrapper'
import { test } from '../../test'

export default async function makeCardsFromSubtitles(
  context: IntegrationTestContext
) {
  test('open project', async () => {
    const { client } = context

    await client.clickElement_(projectsMenu$.recentProjectsListItem)
    await client.waitForText_(
      mediaFilesMenu$.openMediaFilesMenuButton,
      'piggeldy_cat.mp4'
    )
  })

  test('open PBC media file', async () => {
    const { client } = context

    await client.clickElement_(mediaFilesMenu$.openMediaFilesMenuButton)
    await client.clickElement_(mediaFilesMenu$.mediaFileMenuItem)
    await client.waitForText_(
      mediaFilesMenu$.openMediaFilesMenuButton,
      'polar_bear_cafe.mp4'
    )
  })

  test('open subtitles menu', async () => {
    const { client } = context

    await client.clickElement_(subtitlesMenu$.openMenuButton)
    await client.waitForText_(subtitlesMenu$.container, 'pbc_jp.ass')
  })

  test('delete subtitles file pbc_jp.ass', async () => {
    const { client } = context

    await client.elementWithText_(subtitlesMenu$.trackMenuItems, 'pbc_jp.ass')

    const [, pbcTrackOpenSubmenuButton] = await client.elements_(
      subtitlesMenu$.openTrackSubmenuButton
    )
    await pbcTrackOpenSubmenuButton!.click()
    await sleep(100)
    await client.clickElement_(subtitlesMenu$.deleteTrackButton)

    await client.waitUntilGone_(waveform$.subtitlesChunk)
  })

  test('open dialog to generate clips and click button to load a subtitles track', async () => {
    const { app, client } = context

    await retryUntil({
      action: () =>
        client.clickElement_(subtitlesMenu$.makeClipsAndCardsButton),
      check: () =>
        app.client.$(getSelector(confirmationDialog$.okButton)).isExisting(),
      conditionName: 'Confirmation dialog OK button is visible',
    })
    await client.clickElement_(confirmationDialog$.okButton)

    await mockElectronHelpers(app, {
      showOpenDialog: [Promise.resolve([join(ASSETS_DIRECTORY, 'pbc_jp.ass')])],
    })
    await client.clickElement_(subtitleClipsDialog$.loadMoreTracksButton)
  })

  test('link transcription field', async () => {
    const { client } = context

    await client.clickElement_(subtitleClipsDialog$.transcriptionField)
    const [, externalOption] = await client.elements_(
      subtitleClipsDialog$.selectFieldOption,
      2
    )
    externalOption.click()
    await client.waitUntilGone_(subtitleClipsDialog$.selectFieldOption)
  })

  test('link meaning field and submit', async () => {
    const { client } = context

    await client.clickElement_(subtitleClipsDialog$.meaningField)
    const [embeddedOption] = await client.elements_(
      subtitleClipsDialog$.selectFieldOption,
      2
    )
    embeddedOption.click()
    await client.waitUntilGone_(subtitleClipsDialog$.selectFieldOption)
    await client.clickElement_(subtitleClipsDialog$.okButton)
  })

  test('verify links', async () => {
    const { client } = context

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
