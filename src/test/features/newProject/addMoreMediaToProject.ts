import { TestSetup, ASSETS_DIRECTORY } from '../../setUpDriver'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function addMoreMediaToProject({
  app,
  client,
}: TestSetup) {
  const {
    openMediaFilesMenuButton: mediaFilesMenuButton,
    addNewAdditionalMediaButton,
  } = mediaFilesMenu$

  await client.clickElement_(mediaFilesMenuButton)

  const germanVideoPath = join(ASSETS_DIRECTORY, 'piggeldy_cat.mp4')

  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([germanVideoPath])],
  })
  await client.clickElement_(addNewAdditionalMediaButton)

  await client.waitUntil(async () => {
    const videoPath = await client.getAttribute('video', 'src')
    return Boolean(videoPath && videoPath.includes(germanVideoPath))
  })
}
