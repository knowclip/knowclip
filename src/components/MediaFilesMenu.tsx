import React, { useCallback, useState, useEffect } from 'react'
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
import { Loop, PlayArrow, Pause } from '@material-ui/icons'
import DarkTheme from './DarkTheme'
import MediaFilesMenuItem from './MediaFilesMenuItem'
import { showOpenDialog } from '../utils/electron'
import usePopover from '../utils/usePopover'
import truncate from '../utils/truncate'
import * as r from '../redux'
import * as actions from '../actions'
import css from './MainHeader.module.css'

enum $ {
  chooseFirstMediaFileButton = 'choose-media-file-button',
  openMediaFilesMenuButton = 'open-media-files-menu-button',
  mediaFileMenuItem = 'media-file-menu-item',
  addNewAdditionalMediaButton = 'add-new-additional-media-button',
}

const MEDIA_FILTERS = [
  {
    name: 'Audio or video files',
    extensions: [
      'mp3',
      'mp4',
      'wav',
      'ogg',
      'm4a',
      'mkv',
      'flac',
      'avi',
      'mov',
      'aac',
      'webm',
    ],
  },
]

type MediaFilesMenuProps = { className: string; currentProjectId: ProjectId }

const MediaFilesMenu = ({
  className,
  currentProjectId,
}: MediaFilesMenuProps) => {
  const {
    loop,
    currentFileName,
    currentFileId,
    projectMediaFiles,
  } = useSelector((state: AppState) => ({
    loop: r.isLoopOn(state),
    currentFileName: r.getCurrentFileName(state),
    currentFileId: r.getCurrentFileId(state),
    projectMediaFiles: r.getCurrentProjectMediaFiles(state),
  }))
  const popover = usePopover()

  const dispatch = useDispatch()
  const chooseMediaFiles = useCallback(
    async () => {
      const filePaths = await showOpenDialog(MEDIA_FILTERS, true)
      if (filePaths) {
        dispatch(actions.addMediaToProjectRequest(currentProjectId, filePaths))
        popover.close()
      }
    },
    [dispatch, currentProjectId, popover]
  )
  const toggleLoop = useCallback(() => dispatch(actions.toggleLoop()), [
    dispatch,
  ])

  const { playing, playOrPauseAudio } = usePlayButtonSync()

  return (
    <DarkTheme>
      <section className={className} ref={popover.anchorCallbackRef}>
        {projectMediaFiles.length > 0 ? (
          <span
            className={css.mediaFileName}
            title={currentFileName || undefined}
          >
            <Button
              className={css.audioButton}
              onClick={popover.open}
              id={$.openMediaFilesMenuButton}
            >
              {currentFileName
                ? truncate(currentFileName, 40)
                : 'Select media file'}
            </Button>
          </span>
        ) : (
          <Button id={$.chooseFirstMediaFileButton} onClick={chooseMediaFiles}>
            Choose media file
          </Button>
        )}
        {currentFileId && (
          <>
            <Tooltip title="Loop audio (Ctrl + L)">
              <IconButton
                onClick={toggleLoop}
                color={loop ? 'primary' : 'default'}
              >
                <Loop />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={playing ? 'Pause (Ctrl + space)' : 'Play (Ctrl + space)'}
            >
              <IconButton onClick={playOrPauseAudio}>
                {playing ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>
          </>
        )}
        {popover.isOpen && (
          <Popover
            anchorEl={popover.anchorEl}
            open={popover.isOpen}
            onClose={popover.close}
          >
            <MenuList style={{ maxHeight: '20.5em', overflowY: 'auto' }}>
              {projectMediaFiles.map(media => (
                <MediaFilesMenuItem
                  key={media.id}
                  closeMenu={popover.close}
                  mediaFile={media}
                  selected={media.id === currentFileId}
                  currentProjectId={currentProjectId}
                  className={$.mediaFileMenuItem}
                />
              ))}
            </MenuList>
            <Divider />
            <MenuItem dense>
              <ListItemText
                onClick={chooseMediaFiles}
                id={$.addNewAdditionalMediaButton}
              >
                Add new media
              </ListItemText>
            </MenuItem>
          </Popover>
        )}
      </section>
    </DarkTheme>
  )
}

function usePlayButtonSync() {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const startPlaying = () => setPlaying(true)

    document.addEventListener('play', startPlaying, true)
    return () => document.removeEventListener('play', startPlaying, true)
  }, [])
  useEffect(() => {
    const stopPlaying = () => setPlaying(false)

    document.addEventListener('pause', stopPlaying, true)
    return () => document.removeEventListener('pause', stopPlaying, true)
  }, [])

  const playOrPauseAudio = useCallback(() => {
    const player = document.getElementById('mediaPlayer') as
      | HTMLAudioElement
      | HTMLVideoElement
      | null
    if (!player) return
    player.paused ? player.play() : player.pause()
  }, [])

  useEffect(() => {
    const resetPlayButton = () => setPlaying(false)
    document.addEventListener('loadeddata', resetPlayButton, true)
    return () => document.removeEventListener('loadeddata', resetPlayButton)
  }, [])

  return { playOrPauseAudio, playing }
}

export default MediaFilesMenu

export { $ as mediaFilesMenu$ }
