import { TestSetup, MEDIA_DIRECTORY, mockElectronHelpers } from '../../setup'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesNavMenu'
import { join } from 'path'

export default async function addFirstMediaToProject(setup: TestSetup) {
  const { app, client, $ } = setup
  const { chooseFirstMediaFileButton: chooseMediaFileButton } = mediaFilesMenu
  const japaneseVideoPath = join(MEDIA_DIRECTORY, 'polar_bear_cafe.mp4')
  await mockElectronHelpers(app, {
    showOpenDialog: Promise.resolve([japaneseVideoPath]),
  })
  await $(chooseMediaFileButton).click()
  await client.waitUntilTextExists('body', 'polar_bear_cafe.mp4')
  const video = client.$('video')
  expect(await video.getAttribute('src')).toContain(japaneseVideoPath)
}
