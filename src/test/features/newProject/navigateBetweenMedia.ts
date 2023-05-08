import { TestSetup, testBlock } from '../../setUpDriver'
import { mediaFilesMenu$ } from '../../../components/MediaFilesMenu'
import { retryUntil } from '../../driver/retryUntil'
import { getSelector } from '../../driver/ClientWrapper'

export default async function navigateBetweenMedia({ app, client }: TestSetup) {
  await testBlock('ensure previously selected video has loaded', async () => {
    expect(await client.getAttribute('video', 'src')).toContain(
      'piggeldy_cat.mp4'
    )
  })

  const { openMediaFilesMenuButton: mediaFilesMenuButton, mediaFileMenuItem } =
    mediaFilesMenu$

  await testBlock('click to open media files menu', async () => {
    await client.clickElement_(mediaFilesMenuButton)

    await client.waitUntilPresent_(mediaFileMenuItem)
  })

  await testBlock('select other video', async () => {
    const menuItems = await client.elements_(mediaFileMenuItem, 2)

    const menuItemsText = await Promise.all(menuItems.map((mi) => mi.getText()))
    const otherVideoIndex = menuItemsText.findIndex((text) =>
      text.includes('polar_bear_cafe.mp4')
    )
    expect(otherVideoIndex).toBeGreaterThan(-1)

    await retryUntil({
      action: () => menuItems[otherVideoIndex].click(),
      conditionName: 'media files menu has closed',
      check: async () =>
        await app.client.$(getSelector(mediaFilesMenuButton)).isExisting(),
    })
  })

  await testBlock('ensure other video has loaded', async () => {
    await client.waitUntilPresent_(mediaFilesMenuButton)

    expect(await client.getAttribute('video', 'src')).toContain(
      'polar_bear_cafe.mp4'
    )
  })
}
