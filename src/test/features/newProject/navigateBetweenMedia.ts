import { IntegrationTestContext } from '../../setUpDriver'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { retryUntil } from '../../driver/retryUntil'
import { getSelector } from '../../driver/ClientWrapper'

export default async function navigateBetweenMedia(
  context: IntegrationTestContext
) {
  test('ensure previously selected video has loaded', async () => {
    const { client } = context

    expect(await client.getAttribute('video', 'src')).toContain(
      'piggeldy_cat.mp4'
    )
  })

  const { openMediaFilesMenuButton: mediaFilesMenuButton, mediaFileMenuItem } =
    mediaFilesMenu$

  test('click to open media files menu', async () => {
    const { client } = context

    await client.clickElement_(mediaFilesMenuButton)

    await client.waitUntilPresent_(mediaFileMenuItem)
  })

  test('select other video', async () => {
    const { app, client } = context

    const menuItems = await client.elements_(mediaFileMenuItem, 2)

    const menuItemsText = await Promise.all(menuItems.map((mi) => mi.getText()))
    const otherVideoIndex = menuItemsText.findIndex((text) =>
      text.includes('polar_bear_cafe.mp4')
    )
    // TODO: flaky
    expect(otherVideoIndex).toBeGreaterThan(-1)

    await retryUntil({
      action: () => menuItems[otherVideoIndex].click(),
      conditionName: 'media files menu has closed',
      check: async () =>
        await app.client.$(getSelector(mediaFilesMenuButton)).isExisting(),
    })
  })

  test('ensure other video has loaded', async () => {
    const { client } = context

    await client.waitUntilPresent_(mediaFilesMenuButton)

    expect(await client.getAttribute('video', 'src')).toContain(
      'polar_bear_cafe.mp4'
    )
  })
}
