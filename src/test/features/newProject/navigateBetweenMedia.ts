import { TestSetup } from '../../setup'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesMenu'
import { RawResult } from 'webdriverio'

export default async function navigateBetweenMedia({
  clientWrapper,
}: TestSetup) {
  expect(await clientWrapper.getAttribute('video', 'src')).toContain(
    'piggeldy_cat.mp4'
  )

  const {
    openMediaFilesMenuButton: mediaFilesMenuButton,
    mediaFileMenuItem,
  } = mediaFilesMenu

  await clientWrapper.clickElement_(mediaFilesMenuButton)

  await clientWrapper.waitUntilPresent_(mediaFileMenuItem)
  const menuItems = await clientWrapper.elements_(mediaFileMenuItem)
  expect(menuItems).toHaveLength(2)

  const menuItemsText = await Promise.all(menuItems.map(mi => mi.getText()))
  console.log({ menuItemsText })
  const otherVideoIndex = menuItemsText.findIndex(text =>
    text.includes('polar_bear_cafe.mp4')
  )

  await menuItems[otherVideoIndex].click()

  await clientWrapper.waitUntilPresent_(mediaFilesMenuButton)

  expect(await clientWrapper.getAttribute('video', 'src')).toContain(
    'polar_bear_cafe.mp4'
  )
}
