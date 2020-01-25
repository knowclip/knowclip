import { TestSetup, ASSETS_DIRECTORY } from '../../spectronApp'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { waveform$ } from '../../../components/Waveform'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function addFirstMediaToProject({
  app,
  client,
}: TestSetup) {
  const { chooseFirstMediaFileButton: chooseMediaFileButton } = mediaFilesMenu$
  const japaneseVideoPath = join(ASSETS_DIRECTORY, 'polar_bear_cafe.mp4')

  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([japaneseVideoPath])],
  })

  await client.clickElement_(chooseMediaFileButton)

  await client.waitForText('body', 'polar_bear_cafe.mp4')

  expect(await client.getAttribute('video', 'src')).toContain(japaneseVideoPath)

  await client.waitUntilPresent_(waveform$.subtitlesTimelinesContainer)
}
