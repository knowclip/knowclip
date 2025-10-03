'use client'
export function VideoPlayer() {
  const handleClickPlay = () => {
    const videoElement = document.getElementById(
      'mediaPlayer'
    ) as HTMLVideoElement | null
    if (videoElement) {
      videoElement.playbackRate = 1.0
      videoElement.play()
    }
  }

  const handleClickPause = () => {
    const videoElement = document.getElementById(
      'mediaPlayer'
    ) as HTMLVideoElement | null
    if (videoElement) {
      videoElement.pause()
    }
  }

  return (
    <>
      <video
        controls={true}
        id="mediaPlayer"
        controlsList="nodownload nofullscreen"
        className="_video_aawga_9 _mediaPlayer_aawga_5"
        playsInline
        crossOrigin="anonymous"
      >
        <source src="http://192.168.50.82:3001/file/ea843499-d253-4428-b091-8955d820a709/converted/index.m3u8" />
        {/* <source src="http://192.168.50.82:3001/file/ea843499-d253-4428-b091-8955d820a709.mp4" /> */}
        <track
          id="856640fc-364f-445f-96a2-9984e7ec78e7"
          kind="subtitles"
          src="http://192.168.50.82:3001/file/9ce054ba-6fe1-42f4-b24f-f07685c36f56.vtt"
          srcLang="en"
          label="English"
          // crossOrigin="anonymous"
        />
      </video>
      {/* <video id="mediaPlayer" controls controlsList="nofullscreen" playsInline>
        <source src="http://192.168.50.82:3001/file/c6b7880d-5cbc-4171-a45b-fb2f5e5afbfc/converted/index.m3u8" />
        <track
          kind="subtitles"
          src="http://192.168.50.82:3001/file/3c740a14-6701-40cb-aa5a-1b40385a8f7a.vtt"
          mode="hidden"
        />
      </video> */}

      <button onClick={handleClickPlay}>Play</button>
      <button onClick={handleClickPause}>Pause</button>
    </>
  )
}
