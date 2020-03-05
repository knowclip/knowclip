import React, { useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Button,
  IconButton,
  Tooltip,
  MenuItem,
  MenuList,
  ListItemText,
  Divider,
  Popover,
} from '@material-ui/core'
import { PlayArrow, Pause, Loop } from '@material-ui/icons'
import DarkTheme from './DarkTheme'
import MediaFilesMenuItem from './MediaFilesMenuItem'
import { showOpenDialog } from '../utils/electron'
import usePopover from '../utils/usePopover'
import truncate from '../utils/truncate'
import * as r from '../redux'
import * as actions from '../actions'
import css from './MainHeader.module.css'
import {
  startMovingCursor,
  stopMovingCursor,
  setCursorX,
} from '../utils/waveform'
import { getFileFilters } from '../utils/files'

enum $ {
  chooseFirstMediaFileButton = 'choose-media-file-button',
  openMediaFilesMenuButton = 'open-media-files-menu-button',
  mediaFileMenuItem = 'media-file-menu-item',
  addNewAdditionalMediaButton = 'add-new-additional-media-button',
}

type MediaFilesMenuProps = { className: string; currentProjectId: ProjectId }

const MediaFilesMenu = ({
  className,
  currentProjectId,
}: MediaFilesMenuProps) => {
  const { currentFile, projectMediaFiles, loopIsOn } = useSelector(
    (state: AppState) => ({
      loopIsOn: r.isLoopOn(state),
      currentFile: r.getCurrentMediaFile(state),
      projectMediaFiles: r.getCurrentProjectMediaFiles(state),
    })
  )
  const popover = usePopover()

  const dispatch = useDispatch()
  const chooseMediaFiles = useCallback(
    async e => {
      const filePaths = await showOpenDialog(getFileFilters('MediaFile'), true)
      if (filePaths) {
        dispatch(actions.addMediaToProjectRequest(currentProjectId, filePaths))
        popover.close(e)
      }
    },
    [dispatch, currentProjectId, popover]
  )

  const { playing, playOrPauseAudio } = usePlayButtonSync()

  const toggleLoop = useCallback(() => dispatch(actions.toggleLoop()), [
    dispatch,
  ])

  return (
    <DarkTheme>
      <section className={className} ref={popover.anchorCallbackRef}>
        {projectMediaFiles.length > 0 ? (
          <span
            className={css.mediaFileName}
            title={currentFile ? currentFile.name : undefined}
          >
            <Button
              className={css.audioButton}
              onClick={popover.open}
              id={$.openMediaFilesMenuButton}
            >
              {currentFile
                ? truncate(currentFile.name, 40)
                : 'Select media file'}
            </Button>
          </span>
        ) : (
          <Button id={$.chooseFirstMediaFileButton} onClick={chooseMediaFiles}>
            Add media
          </Button>
        )}
        {currentFile && (
          <Tooltip
            title={playing ? 'Pause (Ctrl + space)' : 'Play (Ctrl + space)'}
          >
            <IconButton onClick={playOrPauseAudio}>
              {playing ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>
        )}

        {currentFile && (
          <Tooltip title="Loop selection (Ctrl + L)">
            <IconButton
              onClick={toggleLoop}
              color={loopIsOn ? 'secondary' : 'default'}
            >
              <Loop />
            </IconButton>
          </Tooltip>
        )}
        {popover.isOpen && (
          <Popover
            anchorEl={popover.anchorEl}
            open={popover.isOpen}
            onClose={popover.close}
          >
            <MenuList>
              <div style={{ maxHeight: '20.5em', overflowY: 'auto' }}>
                {projectMediaFiles.map(media => (
                  <MediaFilesMenuItem
                    key={media.id}
                    closeMenu={popover.close}
                    mediaFile={media}
                    autoFocus={Boolean(
                      currentFile && currentFile.id === media.id
                    )}
                    currentProjectId={currentProjectId}
                    className={$.mediaFileMenuItem}
                  />
                ))}
              </div>
              <Divider />
              <MenuItem
                dense
                tabIndex={0}
                onClick={chooseMediaFiles}
                id={$.addNewAdditionalMediaButton}
              >
                <ListItemText>Add new media</ListItemText>
              </MenuItem>
            </MenuList>
          </Popover>
        )}
      </section>
    </DarkTheme>
  )
}

function usePlayButtonSync() {
  const playing = useSelector(r.isMediaPlaying)
  const dispatch = useDispatch()
  const playMedia = useCallback(
    () => {
      startMovingCursor()
      dispatch(r.playMedia())
    },
    [dispatch]
  )
  const pauseMedia = useCallback(
    () => {
      stopMovingCursor()
      dispatch(r.pauseMedia())
    },
    [dispatch]
  )

  useEffect(
    () => {
      const startPlaying = () => playMedia()

      document.addEventListener('play', startPlaying, true)

      return () => document.removeEventListener('play', startPlaying, true)
    },
    [playMedia]
  )
  useEffect(
    () => {
      const stopPlaying = () => pauseMedia()

      document.addEventListener('pause', stopPlaying, true)

      return () => document.removeEventListener('pause', stopPlaying, true)
    },
    [pauseMedia]
  )

  const playOrPauseAudio = useCallback(() => {
    const player = document.getElementById('mediaPlayer') as
      | HTMLAudioElement
      | HTMLVideoElement
      | null
    if (!player) return
    player.paused ? player.play() : player.pause()
  }, [])

  useEffect(
    () => {
      const resetPlayButton = () => {
        pauseMedia()
        setCursorX(0)
      }
      document.addEventListener('loadeddata', resetPlayButton, true)
      return () => document.removeEventListener('loadeddata', resetPlayButton)
    },
    [pauseMedia]
  )

  return { playOrPauseAudio, playing }
}

export default MediaFilesMenu

export { $ as mediaFilesMenu$ }
