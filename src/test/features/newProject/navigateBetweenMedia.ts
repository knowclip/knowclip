import { TestSetup, _ } from '../../setup'
import { testLabels as mediaFilesMenu } from '../../../components/MediaFilesMenu'
import { RawResult } from 'webdriverio'

export default async function navigateBetweenMedia({
  $_,
  $$_,
  client,
}: TestSetup) {
  expect(await client.$('video').getAttribute('src')).toContain(
    'piggeldy_cat.mp4'
  )

  const {
    openMediaFilesMenuButton: mediaFilesMenuButton,
    mediaFileMenuItem,
  } = mediaFilesMenu

  await $_(mediaFilesMenuButton).click()

  await client.waitUntil(() => client.isExisting(_(mediaFileMenuItem)))
  const menuItems = await $$_(mediaFileMenuItem)
  expect(menuItems).toHaveLength(2)

  const menuItemsText: RawResult<string>[] = (await Promise.all(
    menuItems.map(item => client.elementIdText(item.value.ELEMENT))
  )) as any

  const otherVideoIndex = menuItemsText.findIndex(({ value }) =>
    value.includes('polar_bear_cafe.mp4')
  )

  await client.elementIdClick(menuItems[otherVideoIndex].value.ELEMENT)

  await client.waitUntil(() => $_(mediaFilesMenuButton).isExisting())

  expect(await client.$('video').getAttribute('src')).toContain(
    'polar_bear_cafe.mp4'
  )
}
