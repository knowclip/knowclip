import { TestSetup, MEDIA_DIRECTORY, mockElectronHelpers } from '../../setup'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesNavMenu'
import { join } from 'path'

export default async function addMoreMediaToProject({
  app,
  $,
  client,
}: TestSetup) {
  const { mediaFilesMenuButton, addNewAdditionalMediaButton } = mediaFilesMenu

  await $(mediaFilesMenuButton).click()

  const germanVideoPath = join(MEDIA_DIRECTORY, 'piggeldy_cat.mp4')

  await mockElectronHelpers(app, {
    showOpenDialog: Promise.resolve([germanVideoPath]),
  })
  await $(addNewAdditionalMediaButton).click()

  const video = client.$('video')
  expect(await video.getAttribute('src')).toContain(germanVideoPath)
}
