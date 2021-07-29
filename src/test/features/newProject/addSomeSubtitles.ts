import { TestSetup, ASSETS_DIRECTORY } from '../../setUpDriver'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { linkSubtitlesDialog$ } from '../../../components/Dialog/LinkSubtitlesDialog'

export default async function addSomeSubtitles(
  { client, app }: TestSetup,
  subtitlesFileName: string
) {
  await client.clickElement_(subtitlesMenu$.openMenuButton)

  await mockElectronHelpers(app, {
    showOpenDialog: [
      Promise.resolve([join(ASSETS_DIRECTORY, subtitlesFileName)]),
    ],
  })
  await client.clickElement_(subtitlesMenu$.addTrackButton)

  await client.clickElement_(linkSubtitlesDialog$.skipButton)

  await client.clickElement_(subtitlesMenu$.openMenuButton)
  const menuItems = await client.elements_(subtitlesMenu$.trackMenuItems, 2)
  await menuItems[1].waitForText(subtitlesFileName)
  await client.clickAtOffset('body', { x: 100, y: 100 })
}
