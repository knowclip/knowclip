import { ASSETS_DIRECTORY, IntegrationTestContext } from '../../setUpDriver'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu.testLabels'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { test } from '../../test'
import { mockSideEffects } from '../../../utils/sideEffects/mocks'

const {
  openMediaFilesMenuButton: mediaFilesMenuButton,
  addNewAdditionalMediaButton,
} = mediaFilesMenu$

export default async function addMoreMediaToProject(
  context: IntegrationTestContext,
  mediaFileId: string
) {
  const germanVideoPath = join(ASSETS_DIRECTORY, 'piggeldy_cat.mp4')

  test('open menu and open add media dialog', async () => {
    const { client, app } = context
    await client.clickElement_(mediaFilesMenuButton)

    await mockSideEffects(app, {
      uuid: [mediaFileId],
    })
    await mockElectronHelpers(app, {
      showOpenDialog: [Promise.resolve([germanVideoPath])],
    })
    await client.clickElement_(addNewAdditionalMediaButton)
  })

  test('wait for new video to load', async () => {
    const { client } = context

    await client.waitUntil(async () => {
      const videoPath = await client.getAttribute('video', 'src')
      return Boolean(videoPath && videoPath.includes(germanVideoPath))
    })
  })
}
