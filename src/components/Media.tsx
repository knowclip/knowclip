import React, {
  useEffect,
  useRef,
  MutableRefObject,
  AudioHTMLAttributes,
  VideoHTMLAttributes,
  useCallback,
} from 'react'
import { useDispatch } from 'react-redux'
import cn from 'classnames'
import * as r from '../redux'
import css from './Media.module.css'
import { Tooltip, IconButton } from '@material-ui/core'
import { VerticalSplitSharp, HorizontalSplitSharp } from '@material-ui/icons'

type MediaProps = {
  constantBitrateFilePath: string | null
  loop: boolean
  metadata: MediaFile | null
  subtitles: SubtitlesTrack[]
  className?: string
  viewMode: ViewMode
}
let clicked = false
const setClicked = (c: boolean) => {
  clicked = c
}
const Media = ({
  constantBitrateFilePath,
  loop,
  metadata,
  subtitles,
  className,
  viewMode,
}: MediaProps) => {
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null)

  const setUpBlur = useCallback(e => {
    setClicked(true)
    if (mediaRef.current) mediaRef.current.blur()
  }, [])
  const blur = useCallback(e => {
    if (mediaRef.current && clicked) {
      mediaRef.current.blur()
      // setClicked(false)
    }
  }, [])
  const stopBlur = useCallback(e => {
    if (mediaRef.current && clicked) {
      setClicked(false)
    }
  }, [])
  const props:
    | AudioHTMLAttributes<HTMLAudioElement>
    | VideoHTMLAttributes<HTMLVideoElement> = {
    loop: false,
    controls: true,
    // disablePictureInPicture: true,
    id: 'mediaPlayer',
    controlsList: 'nodownload nofullscreen',
    src: constantBitrateFilePath ? `file://${constantBitrateFilePath}` : '',
    // @ts-ignore
    playbackspeed: 1,

    // prevent accidental scrub after play/pause with mouse
    onMouseEnter: setUpBlur,
    onMouseLeave: stopBlur,
    onPlay: blur,
    onPause: blur,
    onClick: blur,
    onVolumeChange: blur,
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

  const dispatch = useDispatch()
  const toggleViewMode = useCallback(
    () => {
      dispatch(
        r.setViewMode(viewMode === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL')
      )
    },
    [dispatch, viewMode]
  )

  if (!metadata)
    return (
      <section className={className}>
        <div />
      </section>
    )

  return (
    <section className={cn(className, css.container)}>
      <Tooltip
        title={
          viewMode === 'HORIZONTAL'
            ? 'Switch to vertical view'
            : 'Switch to horizontal view'
        }
      >
        <IconButton
          style={{ transform: 'rotate(180deg)' }}
          onClick={toggleViewMode}
          className={css.viewModeButton}
        >
          {viewMode === 'HORIZONTAL' ? (
            <VerticalSplitSharp />
          ) : (
            <HorizontalSplitSharp />
          )}
        </IconButton>
      </Tooltip>

      {metadata.isVideo ? (
        <video
          {...props}
          ref={mediaRef as MutableRefObject<HTMLVideoElement>}
          className={cn(css.video, css.mediaPlayer)}
        >
          {subtitles.map((track, index) => (
            <Subtitles
              index={index}
              track={track}
              key={track.id}
              isDefault={index === 0}
            />
          ))}
        </video>
      ) : (
        <audio
          {...props}
          ref={mediaRef as MutableRefObject<HTMLAudioElement>}
          className={cn(css.audio, css.mediaPlayer)}
        />
      )}
    </section>
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
