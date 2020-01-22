import { ClientWrapper } from './ClientWrapper'

export async function setVideoTime(client: ClientWrapper, seconds: number) {
  try {
    await client._client.execute(
      (video: HTMLVideoElement, seconds: number) => {
        video.currentTime = seconds
      },
      (await client._client.$('video')).value,
      seconds
    )
  } catch (err) {
    throw new Error(
      `Could not set video time to ${seconds} seconds: ${err.message}`
    )
  }
}
