import { ClientWrapper } from './ClientWrapper'

export async function setVideoTime(client: ClientWrapper, seconds: number) {
  await client._client.execute(
    (video: HTMLVideoElement, seconds: number) => {
      video.currentTime = seconds
    },
    (await client._client.$('video')).value,
    seconds
  )
}
