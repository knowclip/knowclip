import { ClientWrapper } from './ClientWrapper'

export async function setVideoTime(client: ClientWrapper, seconds: number) {
  try {
    await client._client.execute(
      (seconds: number, mediaPlayerId: string) => {
        const video = document.getElementById(
          mediaPlayerId
        ) as HTMLVideoElement | null
        if (video) video.currentTime = seconds
        else throw new Error('Could not find video element')
      },
      seconds,
      'mediaPlayer'
    )
  } catch (err) {
    throw new Error(
      `Could not set video time to ${seconds} seconds: ${err.message}`
    )
  }
}
