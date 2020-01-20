import { TestSetup, MEDIA_DIRECTORY } from '../../setup'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesMenu'
import { testLabels as waveform } from '../../../components/Waveform'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function addFirstMediaToProject({
  app,
  clientWrapper,
}: TestSetup) {
  const { chooseFirstMediaFileButton: chooseMediaFileButton } = mediaFilesMenu
  const japaneseVideoPath = join(MEDIA_DIRECTORY, 'polar_bear_cafe.mp4')

  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([japaneseVideoPath])],
  })

  await clientWrapper.clickElement_(chooseMediaFileButton)

  await clientWrapper.waitForText('body', 'polar_bear_cafe.mp4')

  expect(await clientWrapper.getAttribute('video', 'src')).toContain(
    japaneseVideoPath
  )

  await clientWrapper.waitUntilPresent_(waveform.subtitlesContainer)
}
