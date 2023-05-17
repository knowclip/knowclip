import { ASSETS_DIRECTORY, IntegrationTestContext } from '../../setUpDriver'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { waveform$ } from '../../../components/waveformTestLabels'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { linkSubtitlesDialog$ } from '../../../components/Dialog/LinkSubtitlesDialog'
import { test, expect } from '../../test'

export default async function addFirstMediaToProject(
  context: IntegrationTestContext,
  videoFilePath: string
) {
  const japaneseVideoPath = join(ASSETS_DIRECTORY, videoFilePath)

  test('choose first media file', async () => {
    const { app, client } = context

    const { chooseFirstMediaFileButton: chooseMediaFileButton } =
      mediaFilesMenu$

    await mockElectronHelpers(app, {
      showOpenDialog: [Promise.resolve([japaneseVideoPath])],
    })

    await client.clickElement_(chooseMediaFileButton)
  })

  test('wait for video to load', async () => {
    const { client } = context
    await client.waitForText('body', videoFilePath)
    expect(await client.getAttribute('video', 'src')).toContain(
      japaneseVideoPath.replace(/\\/g, '/')
    )
  })

  test('skip subtitles link step', async () => {
    const { client } = context
    await client.clickElement_(linkSubtitlesDialog$.skipButton)

    await client.waitUntilGone_(waveform$.subtitlesChunk)
  })
}
