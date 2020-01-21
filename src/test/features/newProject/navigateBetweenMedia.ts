import { TestSetup } from '../../app'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesMenu'

export default async function navigateBetweenMedia({ client }: TestSetup) {
  expect(await client.getAttribute('video', 'src')).toContain(
    'piggeldy_cat.mp4'
  )

  const {
    openMediaFilesMenuButton: mediaFilesMenuButton,
    mediaFileMenuItem,
  } = mediaFilesMenu

  await client.clickElement_(mediaFilesMenuButton)

  await client.waitUntilPresent_(mediaFileMenuItem)
  const menuItems = await client.elements_(mediaFileMenuItem)
  expect(menuItems).toHaveLength(2)

  const menuItemsText = await Promise.all(menuItems.map(mi => mi.getText()))
  const otherVideoIndex = menuItemsText.findIndex(text =>
    text.includes('polar_bear_cafe.mp4')
  )

  await menuItems[otherVideoIndex].click()

  await client.waitUntilPresent_(mediaFilesMenuButton)

  expect(await client.getAttribute('video', 'src')).toContain(
    'polar_bear_cafe.mp4'
  )
}
