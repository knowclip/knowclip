import { ASSETS_DIRECTORY, IntegrationTestContext } from '../../setUpDriver'
import { subtitlesMenu$ } from '../../../components/SubtitlesMenu.testLabels'
import { mockElectronHelpers } from '../../mockElectronHelpers'
import { join } from 'path'
import { linkSubtitlesDialog$ } from '../../../components/Dialog/LinkSubtitlesDialog.testLabels'
import { test } from '../../test'
import { mockSideEffects } from '../../mockSideEffects'

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
    await client.elements_(subtitlesMenu$.trackMenuItems, 2)
    // repeating operation for linux CI, where screenshot shows that the elements are there, but the test fails
    const menuItems = await client.elements_(subtitlesMenu$.trackMenuItems, 2)
    await menuItems[1].waitForText(subtitlesFileName)
    await client.clickAtOffset('body', { x: 100, y: 100 })
  })
}
