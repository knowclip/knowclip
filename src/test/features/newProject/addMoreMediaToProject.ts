import { TestSetup, MEDIA_DIRECTORY } from '../../setup'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesMenu'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function addMoreMediaToProject({
  app,
  clientWrapper,
}: TestSetup) {
  const {
    openMediaFilesMenuButton: mediaFilesMenuButton,
    addNewAdditionalMediaButton,
  } = mediaFilesMenu

  await clientWrapper.clickElement_(mediaFilesMenuButton)

  const germanVideoPath = join(MEDIA_DIRECTORY, 'piggeldy_cat.mp4')

  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([germanVideoPath])],
  })
  await clientWrapper.clickElement_(addNewAdditionalMediaButton)

  await clientWrapper.waitUntil(async () => {
    const videoPath = await clientWrapper.getAttribute('video', 'src')
    return videoPath.includes(germanVideoPath)
  })
}
