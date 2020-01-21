import React, {
  useEffect,
  useRef,
  MutableRefObject,
  AudioHTMLAttributes,
  VideoHTMLAttributes,
} from 'react'
import { useDispatch } from 'react-redux'
import * as r from '../redux'

type MediaProps = {
  constantBitrateFilePath: string | null
  loop: boolean
  metadata: MediaFile | null
  subtitles: SubtitlesTrack[]
}
const Media = ({
  constantBitrateFilePath,
  loop,
  metadata,
  subtitles,
}: MediaProps) => {
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null)

  const props:
    | AudioHTMLAttributes<HTMLAudioElement>
    | VideoHTMLAttributes<HTMLVideoElement> = {
    loop: loop,
    controls: true,
    disablePictureInPicture: true,
    id: 'mediaPlayer',
    className: 'mediaPlayer',
    controlsList: 'nodownload nofullscreen',
    src: constantBitrateFilePath ? `file://${constantBitrateFilePath}` : '',
    // @ts-ignore
    playbackspeed: 1,
  }

  useEffect(
    () => {
      if (props.src) {
        setTimeout(() => {
          const player = document.getElementById('mediaPlayer') as
            | HTMLAudioElement
            | HTMLVideoElement
            | null
          if (player) player.src = props.src || ''
        }, 0)
      }
    },
    [props.src]
  )

  useSyncSubtitlesVisibility(subtitles, mediaRef)

  return metadata && metadata.isVideo ? (
    <div className="videoContainer">
      <video {...props} ref={mediaRef as MutableRefObject<HTMLVideoElement>}>
        {subtitles.map((track, index) => (
          <Subtitles
            index={index}
            track={track}
            key={track.id}
            isDefault={index === 0}
          />
        ))}
      </video>
    </div>
  ) : (
    <audio {...props} ref={mediaRef as MutableRefObject<HTMLAudioElement>} />
  )
}

function useSyncSubtitlesVisibility(
  subtitles: SubtitlesTrack[],
  mediaRef: React.MutableRefObject<HTMLAudioElement | HTMLVideoElement | null>
) {
  const dispatch = useDispatch()

  useEffect(
    () => {
      function syncReduxTracksToDom(event: Event) {
        Array.from(event.target as TextTrackList).forEach((domTrack, i) => {
          const track: SubtitlesTrack | undefined = subtitles.find(
            track => track.id === domTrack.id
          )
          console.log(
            track && track.type + '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
          )
          console.log(
            `DOM triggers redux change? ${track &&
              track.mode !== domTrack.mode}`,
            `track ${i} is now ${domTrack.mode}`,
            `redux track is ${track && track.mode}`
          )

          if (track && track.mode !== domTrack.mode)
            dispatch(
              domTrack.mode === 'showing'
                ? r.showSubtitles(track.id, track.mediaFileId)
                : r.hideSubtitles(track.id, track.mediaFileId)
            )
        })
      }
      if (mediaRef.current)
        mediaRef.current.textTracks.addEventListener(
          'change',
          syncReduxTracksToDom
        )
      const currentMediaRef = mediaRef.current
      return () => {
        if (currentMediaRef)
          currentMediaRef.textTracks.removeEventListener(
            'change',
            syncReduxTracksToDom
          )
      }
    },
    [subtitles, dispatch, mediaRef]
  )
  useEffect(
    () => {
      if (!mediaRef.current) return
      for (const track of subtitles) {
        const domTrack = [...mediaRef.current.textTracks].find(
          domTrack => domTrack.id === track.id
        )
        console.log(`${track.type}!!!!!!!!!!!!!!!!!!!!!!!!!!!`)
        console.log(
          `DOM track ${domTrack &&
            [...mediaRef.current.textTracks].indexOf(
              domTrack
            )} is currently ${domTrack && domTrack.mode}`,
          `redux track is ${track.mode}`
        )
        if (domTrack && domTrack.mode !== track.mode) domTrack.mode = track.mode
      }
    },
    [subtitles, mediaRef]
  )
}

declare module 'react' {
  interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
    mode?: TextTrackMode
  }
}
declare global {
  interface TextTrack {
    id?: string
  }
}

const Subtitles = ({
  track,
  isDefault,
}: {
  track: SubtitlesTrack
  index: number
  isDefault: boolean
}) =>
  track.type === 'EmbeddedSubtitlesTrack' ? (
    <track
      id={track.id}
      kind="subtitles"
      src={`file://${track.tmpFilePath}`}
      mode={track.mode}
      default={isDefault}
    />
  ) : (
    <track
      id={track.id}
      kind="subtitles"
      src={`file://${track.vttFilePath}`}
      mode={track.mode}
      default={isDefault}
    />
  )

export default Media
