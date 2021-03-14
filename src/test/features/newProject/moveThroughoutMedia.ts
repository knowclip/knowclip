import { testBlock, TestSetup } from '../../setUpDriver'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { waveform$ } from '../../../components/Waveform'
import { setVideoTime } from '../../driver/media'
import { waveformMouseDrag } from '../../driver/waveform'
import { ClientWrapper } from '../../driver/ClientWrapper'

export default async function moveThroughoutMedia({ client }: TestSetup) {
  await testBlock('seek to new time in video', async () => {
    const waveformClips = await client.elements_(waveform$.waveformClip)
    expect(
      await Promise.all(waveformClips.map((c) => c.isVisible()))
    ).toMatchObject([true, true])
    await setVideoTime(client, 61)

    await client.waitUntil(async () => {
      const clips = await client.elements_(waveform$.waveformClip)
      return (await Promise.all(clips.map((c) => c.isVisible()))).every(
        (visible) => !visible
      )
    })
  })

  await testBlock('shift waveform view by selecting clip at screen edge', async () => {
    await waveformMouseDrag(client, 710, 1008)
    await client.waitForText('body', '3 / 3')

    await client.waitUntil(async () => {
      try {
        const visibility = (await clipsVisibility(client)).join(' ')
        return visibility === 'false false true'
      } catch (err) {
        console.error(err)
        throw new Error(
          'Something went wrong when waiting for visiblity: ' + String(err)
        )
      }
    })
    expect(await clipsVisibility(client)).toMatchObject([false, false, true])

  })

  await testBlock('shift waveform view by navigating with previous button', async () => {
    await client.clickElement_(flashcardSection$.previousClipButton)
    await client.waitForText('body', '2 / 3')

    await client.waitUntil(async () => {
      return (await clipsVisibility(client)).join(' ') === 'false true false'
    })
    expect(await clipsVisibility(client)).toMatchObject([false, true, false])
    expect(
      Number(await client.getAttribute('video', 'currentTime'))
    ).toBeLessThan(53)
  })
}

async function clipsVisibility(wrapper: ClientWrapper) {
  return await Promise.all(
    await (await wrapper.elements_(waveform$.waveformClip)).map((el) =>
      el.isVisible()
    )
  )
}
