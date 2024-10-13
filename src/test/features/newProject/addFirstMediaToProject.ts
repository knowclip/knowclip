import { ASSETS_DIRECTORY, IntegrationTestContext } from '../../setUpDriver'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu.testLabels'
import { waveform$ } from '../../../components/waveformTestLabels'
import { join } from 'path'
import { mockElectronHelpers } from '../../mockElectronHelpers'
import { linkSubtitlesDialog$ } from '../../../components/Dialog/LinkSubtitlesDialog.testLabels'
import { test, expect } from '../../test'
import { mockSideEffects } from '../../mockSideEffects'

export default async function addFirstMediaToProject(
  context: IntegrationTestContext,
  videoFilePath: string,
  mediaFileId1: string,
  embeddedSubtitlesId: string
) {
  const japaneseVideoPath = join(ASSETS_DIRECTORY, videoFilePath)

  test('choose first media file', async () => {
    const { app, client } = context

    const { chooseFirstMediaFileButton: chooseMediaFileButton } =
      mediaFilesMenu$

    await mockSideEffects(app, {
      uuid: [mediaFileId1, embeddedSubtitlesId],
    })
    await mockElectronHelpers(app, {
      showOpenDialog: [Promise.resolve([japaneseVideoPath])],
    })

    await client.clickElement_(chooseMediaFileButton)
  })

  test('wait for video to load', async () => {
    const { client } = context
    await client.waitForText('body', videoFilePath)
    expect(await client.getAttribute('video > source', 'src')).toContain(
      '/file/' + mediaFileId1
    )
  })

  test('skip subtitles link step', async () => {
    const { client } = context
    await client.clickElement_(linkSubtitlesDialog$.skipButton)

    await client.waitUntilGone_(waveform$.subtitlesChunk)
  })
}
