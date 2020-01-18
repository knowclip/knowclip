import { TestSetup, MEDIA_DIRECTORY, mockElectronHelpers } from '../../setup'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesNavMenu'
import { join } from 'path'

export default async function navigateBetweenMedia({
  app,
  $,
  client,
}: TestSetup) {
  const { mediaFilesMenuButton, addNewAdditionalMediaButton } = mediaFilesMenu

  await $(mediaFilesMenuButton).click()

  await $(addNewAdditionalMediaButton).click()

  // const video = client.$('video')
  // expect(await video.getAttribute('src')).toContain(germanVideoPath)
}
