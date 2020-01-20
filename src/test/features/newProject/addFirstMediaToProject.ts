import { TestSetup, MEDIA_DIRECTORY, _ } from '../../setup'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesMenu'
import { testLabels as waveform } from '../../../components/Waveform'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function addFirstMediaToProject(setup: TestSetup) {
  const { app, client, $_ } = setup
  const { chooseFirstMediaFileButton: chooseMediaFileButton } = mediaFilesMenu
  const japaneseVideoPath = join(MEDIA_DIRECTORY, 'polar_bear_cafe.mp4')
  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([japaneseVideoPath])],
  })
  await $_(chooseMediaFileButton).click()
  await client.waitUntilTextExists('body', 'polar_bear_cafe.mp4')
  const video = client.$('video')
  expect(await video.getAttribute('src')).toContain(japaneseVideoPath)

  await client.waitUntil(
    async () => await client.isExisting(_(waveform.subtitlesContainer))
  )
}
