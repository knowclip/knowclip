import { TestSetup } from '../../setup'
import { dragMouse } from '../../driver'
import { testLabels as flashcardSection } from '../../../components/FlashcardSection'

export default async function moveThroughoutMedia({
  app,
  $_,
  $$_,
  client,
}: TestSetup) {
  expect(await client.isVisible('.waveform-clip')).toMatchObject([true, true])
  await client.execute((video: HTMLVideoElement) => {
    video.currentTime = 53
  }, (await client.$('video')).value)

  await client.waitUntil(async () =>
    (((await client.isVisible(
      '.waveform-clip'
    )) as unknown) as boolean[]).every(isVisible => !isVisible)
  )

  await dragMouse(app, [1106, 422], [1404, 422])

  await client.waitUntil(
    async () => [...(await client.$$('.waveform-clip'))].length === 3
  )
  expect(await client.isVisible('.waveform-clip')).toMatchObject([
    false,
    false,
    true,
  ])

  await $_(flashcardSection.previousClipButton).click()

  expect(await client.isVisible('.waveform-clip')).toMatchObject([
    false,
    true,
    false,
  ])
  expect(
    Number(await client.$('video').getAttribute('currentTime'))
  ).toBeLessThan(53)
}
