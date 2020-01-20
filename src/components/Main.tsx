import React, {
  Fragment,
  useEffect,
  useRef,
  useCallback,
  MutableRefObject,
  HTMLAttributes,
} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, CircularProgress, Tooltip, Fab } from '@material-ui/core'
import {
  Hearing as HearingIcon,
  Delete as DeleteIcon,
  Layers,
} from '@material-ui/icons'
import { Redirect } from 'react-router-dom'
import Waveform from '../components/Waveform'
import FlashcardSection from '../components/FlashcardSection'
import MediaFilesMenu from '../components/MediaFilesMenu'
import KeyboardShortcuts from '../components/KeyboardShortcuts'
import ProjectMenu from '../components/ProjectMenu'
import DarkTheme from '../components/DarkTheme'
import headerCss from '../components/Header.module.css'
import * as r from '../redux'
import * as actions from '../actions'
import SubtitlesMenu from '../components/SubtitlesMenu'

export const testLabels = {
  exportButton: 'export-button',
} as const

declare module 'react' {
  interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
    mode?: TextTrackMode
  }
}

const Subtitles = ({
  track,
  isDefault,
}: {
  track: SubtitlesTrack
  isDefault: boolean
}) =>
  track.type === 'EmbeddedSubtitlesTrack' ? (
    <track
      kind="subtitles"
      src={`file://${track.tmpFilePath}`}
      mode={track.mode}
      default={isDefault}
    />
  ) : (
    <track
      kind="subtitles"
      src={`file://${track.vttFilePath}`}
      mode={track.mode}
      default={isDefault}
    />
  )

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
  const props = {
    loop: loop,
    controls: true,
    disablePictureInPicture: true,
    id: 'mediaPlayer',
    className: 'mediaPlayer',
    controlsList: 'nodownload nofullscreen',
    src: constantBitrateFilePath ? `file://${constantBitrateFilePath}` : '',
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
  useEffect(
    () => {
      if (!mediaRef.current) return
      const { textTracks } = mediaRef.current
      if (textTracks)
        [...textTracks].forEach(
          (track, index) => (track.mode = subtitles[index].mode)
        )
    },
    [subtitles, mediaRef]
  )

  return metadata && metadata.isVideo ? (
    <div className="videoContainer">
      <video {...props} ref={mediaRef as MutableRefObject<HTMLVideoElement>}>
        {subtitles.map((track, index) =>
          track.mode === 'showing' ? (
            <Subtitles track={track} key={track.id} isDefault={index === 0} />
          ) : null
        )}
      </video>
    </div>
  ) : (
    <audio {...props} />
  )
}

const Main = () => {
  const {
    currentFileName,
    currentFilePath,
    currentFlashcard,
    loop,
    audioIsLoading,
    currentProjectId,
    constantBitrateFilePath,
    currentMediaFile,
    subtitles,
  } = useSelector((state: AppState) => ({
    currentFileName: r.getCurrentFileName(state),
    currentFilePath: r.getCurrentFilePath(state),
    currentFlashcard: r.getCurrentFlashcard(state),
    loop: r.isLoopOn(state),
    audioIsLoading: r.isAudioLoading(state),
    currentProjectId: r.getCurrentProjectId(state),
    constantBitrateFilePath: r.getCurrentMediaConstantBitrateFilePath(state),
    currentMediaFile: r.getCurrentMediaFile(state),
    subtitles: r.getSubtitlesTracks(state),
  }))
  const dispatch = useDispatch()

  const reviewAndExportDialog = useCallback(
    () => dispatch(actions.reviewAndExportDialog()),
    [dispatch]
  )
  const detectSilenceRequest = useCallback(
    () => dispatch(actions.detectSilenceRequest()),
    [dispatch]
  )
  const deleteAllCurrentFileClipsRequest = useCallback(
    () => dispatch(actions.deleteAllCurrentFileClipsRequest()),
    [dispatch]
  )

  if (!currentProjectId) return <Redirect to="/projects" />

  return (
    <div className="App">
      <DarkTheme>
        <header className={headerCss.container}>
          <ProjectMenu className={headerCss.block} />
          <section className={headerCss.block}>
            <MediaFilesMenu
              className={headerCss.leftMenu}
              currentProjectId={currentProjectId}
            />
          </section>
          <ul className={headerCss.rightMenu}>
            {currentMediaFile && (
              <Fragment>
                <li className={headerCss.menuItem}>
                  <SubtitlesMenu />
                </li>
                <li className={headerCss.menuItem}>
                  <Tooltip title="Detect silences">
                    <IconButton onClick={detectSilenceRequest}>
                      <HearingIcon />
                    </IconButton>
                  </Tooltip>
                </li>
                <li className={headerCss.menuItem}>
                  <Tooltip title="Delete all clips for this media">
                    <IconButton onClick={deleteAllCurrentFileClipsRequest}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </li>
              </Fragment>
            )}
          </ul>
        </header>
      </DarkTheme>

      <section className="media">
        <Media
          key={String(constantBitrateFilePath)}
          constantBitrateFilePath={constantBitrateFilePath}
          loop={loop}
          metadata={currentMediaFile}
          subtitles={subtitles}
        />
      </section>
      {Boolean(currentFileName) && <Waveform show={!audioIsLoading} />}
      {audioIsLoading && (
        <div className="waveform-placeholder">
          <CircularProgress />
        </div>
      )}
      <FlashcardSection showing={Boolean(currentFlashcard)} />
      {currentFilePath && (
        <Tooltip title="Review and export flashcards">
          <Fab
            id={testLabels.exportButton}
            className="floatingActionButton"
            onClick={reviewAndExportDialog}
            color="primary"
          >
            <Layers />
          </Fab>
        </Tooltip>
      )}
      <KeyboardShortcuts />
    </div>
  )
}

export default Main
