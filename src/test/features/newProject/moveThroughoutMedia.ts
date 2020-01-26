import { TestSetup } from '../../spectronApp'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { waveform$ } from '../../../components/Waveform'
import { setVideoTime } from '../../driver/media'
import { waveformMouseDrag } from '../../driver/waveform'

export default async function moveThroughoutMedia({ app, client }: TestSetup) {
  const waveformClips = await client.elements_(waveform$.waveformClip)
  expect(
    await Promise.all(waveformClips.map(c => c.isVisible()))
  ).toMatchObject([true, true])
  await setVideoTime(client, 61)

  await client.waitUntil(async () => {
    const clips = await client.elements_(waveform$.waveformClip)
    return (await Promise.all(clips.map(c => c.isVisible()))).every(
      visible => !visible
    )
  })

  await waveformMouseDrag(app, client, 710, 1008)

  await client.waitUntil(
    async () => (await client.elements_(waveform$.waveformClip)).length === 3
  )

  const clipsVisibility = async () =>
    await Promise.all(
      (await client.elements_(waveform$.waveformClip)).map(c => c.isVisible())
    )
  expect(await clipsVisibility()).toMatchObject([false, false, true])

  await client.clickElement_(flashcardSection$.previousClipButton)

  expect(await clipsVisibility()).toMatchObject([false, true, false])
  expect(
    Number(await client.getAttribute('video', 'currentTime'))
  ).toBeLessThan(53)
}
