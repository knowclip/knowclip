import { TestSetup } from '../../setup'
import { dragMouse } from '../../driver'
import { testLabels as flashcardSection } from '../../../components/FlashcardSection'

export default async function moveThroughoutMedia({
  app,
  clientWrapper,
}: TestSetup) {
  const waveformClips = await clientWrapper.elements('.waveform-clip')
  expect(
    await Promise.all(waveformClips.map(c => c.isVisible()))
  ).toMatchObject([true, true])
  await clientWrapper._client.execute((video: HTMLVideoElement) => {
    video.currentTime = 53
  }, (await clientWrapper._client.$('video')).value)

  await clientWrapper.waitUntil(async () => {
    const clips = await clientWrapper.elements('.waveform-clip')
    return (await Promise.all(clips.map(c => c.isVisible()))).every(
      visible => !visible
    )
  })

  await dragMouse(app, [1106, 422], [1404, 422])

  await clientWrapper.waitUntil(
    async () => (await clientWrapper.elements('.waveform-clip')).length === 3
  )

  const clipsVisibility = async () =>
    await Promise.all(
      (await clientWrapper.elements('.waveform-clip')).map(c => c.isVisible())
    )
  expect(await clipsVisibility()).toMatchObject([false, false, true])

  await clientWrapper.clickElement_(flashcardSection.previousClipButton)

  expect(await clipsVisibility()).toMatchObject([false, true, false])
  expect(
    Number(await clientWrapper.getAttribute('video', 'currentTime'))
  ).toBeLessThan(53)
}
