import { TestSetup, ASSETS_DIRECTORY } from '../../setUpDriver'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { waveform$ } from '../../../components/waveformTestLabels'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { linkSubtitlesDialog$ } from '../../../components/Dialog/LinkSubtitlesDialog'

export default async function addFirstMediaToProject(
  { app, client }: TestSetup,
  videoFilePath: string
) {
  const { chooseFirstMediaFileButton: chooseMediaFileButton } = mediaFilesMenu$
  const japaneseVideoPath = join(ASSETS_DIRECTORY, videoFilePath)

  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([japaneseVideoPath])],
  })

  await client.clickElement_(chooseMediaFileButton)

  await client.waitForText('body', videoFilePath)

  expect(await client.getAttribute('video', 'src')).toContain(
    japaneseVideoPath.replace(/\\/g, '/')
  )

  await client.clickElement_(linkSubtitlesDialog$.skipButton)

  await client.waitUntilGone_(waveform$.subtitlesChunk)
}
