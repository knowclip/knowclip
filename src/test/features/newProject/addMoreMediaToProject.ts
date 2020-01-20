import { TestSetup, MEDIA_DIRECTORY, _ } from '../../setup'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesNavMenu'
import { join } from 'path'
import { mockElectronHelpers } from '../../../utils/electron/mocks'

export default async function addMoreMediaToProject({
  app,
  $_,
  client,
}: TestSetup) {
  const { mediaFilesMenuButton, addNewAdditionalMediaButton } = mediaFilesMenu

  await $_(mediaFilesMenuButton).click()

  const germanVideoPath = join(MEDIA_DIRECTORY, 'piggeldy_cat.mp4')

  await mockElectronHelpers(app, {
    showOpenDialog: [Promise.resolve([germanVideoPath])],
  })
  await $_(addNewAdditionalMediaButton).click()

  await client.waitUntil(
    async () => !(await client.isExisting(_(addNewAdditionalMediaButton)))
  )

  const video = client.$('video')
  expect(await video.getAttribute('src')).toContain(germanVideoPath)
}
