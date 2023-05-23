import { ASSETS_DIRECTORY, IntegrationTestContext } from '../../setUpDriver'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu.testLabels'
import { mockElectronHelpers } from '../../../utils/electron/mocks'
import { join } from 'path'
import { linkSubtitlesDialog$ } from '../../../components/Dialog/LinkSubtitlesDialog.testLabels'
import { test } from '../../test'
import { mockSideEffects } from '../../../utils/sideEffects/mocks'

export default async function addSomeSubtitles(
  context: IntegrationTestContext,
  subtitlesFileName: string,
  subtitlesTrackId: string
) {
  test('open subtitles menu and add track', async () => {
    const { client, app } = context
    await client.clickElement_(subtitlesMenu$.openMenuButton)

    await mockSideEffects(app, {
      uuid: [subtitlesTrackId],
    })
    await mockElectronHelpers(app, {
      showOpenDialog: [
        Promise.resolve([join(ASSETS_DIRECTORY, subtitlesFileName)]),
      ],
    })
    await client.clickElement_(subtitlesMenu$.addTrackButton)

    await client.clickElement_(linkSubtitlesDialog$.skipButton)
  })

  test('see two tracks in subtitles menu', async () => {
    const { client } = context
    await client.clickElement_(subtitlesMenu$.openMenuButton)
    const menuItems = await client.elements_(subtitlesMenu$.trackMenuItems, 2)
    await menuItems[1].waitForText(subtitlesFileName)
    await client.clickAtOffset('body', { x: 100, y: 100 })
  })
}
