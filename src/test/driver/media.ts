import { MEDIA_PLAYER_ID } from '../../components/Media'
import { ClientWrapper } from './ClientWrapper'

export async function setVideoTime(client: ClientWrapper, seconds: number) {
  try {
    await client._driver.client.execute(
      (seconds: number, mediaPlayerId: string) => {
        const video = document.getElementById(
          mediaPlayerId
        ) as HTMLVideoElement | null
        console.log("setting time to", seconds)
        if (video) {
          video.click()
          video.currentTime = seconds
        }
        else throw new Error('Could not find video element')
      },
      seconds,
      MEDIA_PLAYER_ID
    )
  } catch (err) {
    throw new Error(
      `Could not set video time to ${seconds} seconds: ${err.message}`
    )
  }
}
