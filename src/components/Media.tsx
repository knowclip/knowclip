import React, {
  useEffect,
  useRef,
  MutableRefObject,
  AudioHTMLAttributes,
  VideoHTMLAttributes,
  useCallback,
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import cn from 'classnames'
import * as r from '../redux'
import css from './Media.module.css'
import { Tooltip, IconButton } from '@material-ui/core'
import { VerticalSplitSharp, HorizontalSplitSharp } from '@material-ui/icons'
import { SubtitlesFileWithTrack, MediaSubtitles } from '../redux'

export const MEDIA_PLAYER_ID = 'mediaPlayer'

type MediaProps = {
  constantBitrateFilePath: string | null
  loop: boolean
  metadata: MediaFile | null
  subtitles: MediaSubtitles
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

  const seekOn = useCallback((e) => {
    ;(window as any).seeking = true
  }, [])
  const seekOff = useCallback((e) => {
    ;(window as any).seeking = false
  }, [])

  const setUpBlur = useCallback((e) => {
    setClicked(true)
    if (mediaRef.current) mediaRef.current.blur()
  }, [])
  const blur = useCallback((e) => {
    if (mediaRef.current && clicked) {
      mediaRef.current.blur()
      // setClicked(false)
    }
  }, [])
  const stopBlur = useCallback((e) => {
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
    id: MEDIA_PLAYER_ID,
    controlsList: 'nodownload nofullscreen',
    src: constantBitrateFilePath
      ? new URL(`file://${constantBitrateFilePath}`).toString()
      : '',
    // @ts-ignore
    playbackspeed: 1,

    onSeeking: seekOn,
    onSeeked: seekOff,

    // prevent accidental scrub after play/pause with mouse
    onMouseEnter: setUpBlur,
    onMouseLeave: stopBlur,
    onPlay: blur,
    onPause: blur,
    onClick: blur,
    onVolumeChange: blur,
  }

  useEffect(() => {
    if (props.src) {
      setTimeout(() => {
        const player = document.getElementById('mediaPlayer') as
          | HTMLAudioElement
          | HTMLVideoElement
          | null
        if (player) player.src = props.src || ''
      }, 0)
    }
  }, [props.src])

  useSyncSubtitlesVisibility(subtitles.all, mediaRef)

  const dispatch = useDispatch()
  const toggleViewMode = useCallback(() => {
    dispatch(
      r.setViewMode(viewMode === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL')
    )
  }, [dispatch, viewMode])

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
          {subtitles.all.map((track, index) => {
            const displayFile = track.displayFile
            return (
              <Subtitles
                track={track.track}
                index={index}
                displayFile={displayFile}
                key={track.id}
                isDefault={index === 0}
              />
            )
          })}
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
  subtitles: SubtitlesFileWithTrack[],
  mediaRef: React.MutableRefObject<HTMLAudioElement | HTMLVideoElement | null>
) {
  const dispatch = useDispatch()

  useEffect(() => {
    function syncReduxTracksToDom(event: Event) {
      Array.from(event.target as TextTrackList).forEach((domTrack, i) => {
        const track = subtitles.find((track) => track.id === domTrack.id)
        if (track && track.track && track.track.mode !== domTrack.mode)
          dispatch(
            domTrack.mode === 'showing'
              ? r.showSubtitles(track.id)
              : r.hideSubtitles(track.id)
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
  }, [subtitles, dispatch, mediaRef])
  useEffect(() => {
    if (!mediaRef.current) return
    for (const track of subtitles) {
      const domTrack = [...mediaRef.current.textTracks].find(
        (domTrack) => domTrack.id === track.id
      )
      if (domTrack && track.track && domTrack.mode !== track.track.mode)
        domTrack.mode = track.track.mode
    }
  }, [subtitles, mediaRef])
}

declare module 'react' {
  interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
    mode?: TextTrackMode
  }
}

const Subtitles = ({
  track,
  displayFile,
  isDefault,
}: {
  track: SubtitlesTrack | null
  displayFile: SubtitlesFile | null
  index: number
  isDefault: boolean
}) => {
  const { availability } = useSelector((state: AppState) => ({
    availability: displayFile
      ? r.getFileAvailability(state, displayFile)
      : null,
  }))

  if (!track || !availability || availability.status !== 'CURRENTLY_LOADED')
    return null

  return track.type === 'EmbeddedSubtitlesTrack' ? (
    <track
      id={track.id}
      kind="subtitles"
      src={new URL(`file://${availability.filePath}`).toString()}
      mode={track.mode}
      default={isDefault}
    />
  ) : (
    <track
      id={track.id}
      kind="subtitles"
      src={new URL(`file://${availability.filePath}`).toString()}
      mode={track.mode}
      default={isDefault}
    />
  )
}
export default Media
