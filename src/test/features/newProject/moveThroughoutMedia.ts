import { TestSetup } from '../../spectronApp'
import { flashcardSection$ } from '../../../components/FlashcardSection'
import { waveform$ } from '../../../components/Waveform'
import { setVideoTime } from '../../driver/media'
import { waveformMouseDrag } from '../../driver/waveform'
import { ClientWrapper } from '../../driver/ClientWrapper'

export default async function moveThroughoutMedia({ app, client }: TestSetup) {
  const waveformClips = await client.elements_(waveform$.waveformClip)
  expect(
    await Promise.all(waveformClips.map(c => c.isVisible()))
  ).toMatchObject([true, true])
  await setVideoTime(client, 61)

  process.stdout.write('\n waiting for all invisible \n')

  await client.waitUntil(async () => {
    const vis = await clipsVisibility(client)
    console.log({ vis })
    return vis.join(' ') === `false false`
  })

  await waveformMouseDrag(app, client, 710, 1008)
  process.stdout.write('\n waiting for all three clips \n')
  await client.waitForText('body', '3 / 3')

  await client.waitUntil(async () => {
    const visibilities = await clipsVisibility(client)
    return visibilities.join(' ') === `false false true`
  })

  await client.clickElement_(flashcardSection$.previousClipButton)
  await client.waitForText('body', '2 / 3')

  await client.waitUntil(async () => {
    const vis = await clipsVisibility(client)
    console.log({ vis })
    return vis.join(' ') === `false true false`
  })
  expect(
    Number(await client.getAttribute('video', 'currentTime'))
  ).toBeLessThan(53)
}

async function clipsVisibility(wrapper: ClientWrapper) {
  return await Promise.all(
    await (await wrapper.elements_(waveform$.waveformClip)).map(el =>
      el.isVisible()
    )
  )
}
