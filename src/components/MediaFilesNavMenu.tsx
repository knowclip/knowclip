import React, { useCallback, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Button,
  IconButton,
  Tooltip,
  MenuItem,
  MenuList,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Popover,
  Menu,
} from '@material-ui/core'
import {
  Loop,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  PlayArrow,
  Pause,
  FolderSpecial,
} from '@material-ui/icons'
import DarkTheme from './DarkTheme'
import { showOpenDialog } from '../utils/electron'
import usePopover from '../utils/usePopover'
import truncate from '../utils/truncate'
import * as r from '../redux'
import * as actions from '../actions'
import css from './Header.module.css'

export const testLabels = {
  chooseFirstMediaFileButton: 'choose-media-file-button',
  addNewAdditionalMediaButton: 'add-new-additional-media-button',
  mediaFilesMenuButton: 'select-media-file-button',
}

const CONFIRM_DELETE_MEDIA_FROM_PROJECT_MESSAGE =
  'Are you sure you want to remove this media file? This action will delete any flashcards you might have made with it.'
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

type MediaFileMenuItemProps = {
  mediaFile: MediaFile
  selected: boolean
  currentProjectId: ProjectId
  closeMenu: (event: React.SyntheticEvent<Element, Event>) => void
}

const MediaFileMenuItem = ({
  mediaFile,
  selected,
  currentProjectId,
  closeMenu: closeSupermenu,
}: MediaFileMenuItemProps) => {
  const dispatch = useDispatch()

  const submenu = usePopover()
  const closeSubmenu = submenu.close
  const closeMenu = useCallback(
    e => {
      closeSubmenu(e)
      closeSupermenu(e)
    },
    [closeSubmenu, closeSupermenu]
  )

  const loadAndClose = useCallback(
    e => {
      dispatch(actions.openFileRequest(mediaFile))
      closeMenu(e)
    },
    [dispatch, mediaFile, closeMenu]
  )
  const deleteAndClose = useCallback(
    e => {
      dispatch(
        actions.confirmationDialog(
          CONFIRM_DELETE_MEDIA_FROM_PROJECT_MESSAGE,
          actions.deleteMediaFromProject(currentProjectId, mediaFile.id)
        )
      )
      closeMenu(e)
    },
    [dispatch, mediaFile, currentProjectId, closeMenu]
  )
  const locateAndClose = useCallback(
    e => {
      dispatch(
        actions.locateFileRequest(mediaFile, 'Please locate this media file.')
      )
      closeMenu(e)
    },
    [dispatch, mediaFile, closeMenu]
  )
  const { fileAvailability } = useSelector((state: AppState) => ({
    fileAvailability: r.getFileAvailabilityById(
      state,
      'MediaFile',
      mediaFile.id
    ),
  }))
  const needsFilePath = !(fileAvailability && fileAvailability.filePath)
  useEffect(
    () => {
      if (selected && submenu.anchorEl) submenu.anchorEl.scrollIntoView()
    },
    [submenu.anchorEl, selected]
  )

  const actionsButton = (
    <ListItemSecondaryAction>
      <IconButton
        onClick={e => {
          e.stopPropagation()
          submenu.toggle(e)
        }}
        buttonRef={submenu.anchorCallbackRef}
      >
        {needsFilePath ? <FolderSpecial /> : <MoreVertIcon />}
      </IconButton>
    </ListItemSecondaryAction>
  )
  return (
    <MenuItem
      dense
      key={mediaFile.id}
      selected={selected}
      onClick={loadAndClose}
    >
      <ListItemText
        title={mediaFile.name}
        className={css.mediaFilesMenuListItemText}
      >
        {truncate(mediaFile.name, 40)}
      </ListItemText>
      <Menu
        open={submenu.isOpen}
        anchorEl={submenu.anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={useCallback(
          e => {
            e.stopPropagation()
            closeSubmenu(e)
          },
          [closeSubmenu]
        )}
        onClick={useCallback(e => {
          e.stopPropagation()
        }, [])}
      >
        <MenuList>
          <MenuItem dense style={{ width: 200 }} onClick={loadAndClose}>
            <ListItemIcon>
              <PlayArrow />
            </ListItemIcon>
            <ListItemText>Open</ListItemText>
          </MenuItem>
          <MenuItem dense style={{ width: 200 }} onClick={deleteAndClose}>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
          <MenuItem dense style={{ width: 200 }} onClick={locateAndClose}>
            <ListItemIcon>
              <FolderSpecial />
            </ListItemIcon>
            <ListItemText>Locate in file system</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
      {needsFilePath ? (
        <Tooltip title="Not found in file system">{actionsButton}</Tooltip>
      ) : (
        actionsButton
      )}
    </MenuItem>
  )
}

const MediaFilesNavMenu = ({ className }: { className: string }) => {
  const {
    loop,
    currentFileName,
    currentFileId,
    currentProjectId,
    projectMediaFiles,
  } = useSelector((state: AppState) => ({
    loop: r.isLoopOn(state),
    currentFileName: r.getCurrentFileName(state),
    currentFileId: r.getCurrentFileId(state),
    currentProjectId: r.getCurrentProjectId(state),
    projectMediaFiles: r.getCurrentProjectMediaFiles(state),
  }))

  if (!currentProjectId) throw new Error('Could not find project')

  const dispatch = useDispatch()
  const chooseMediaFiles = useCallback(
    async () => {
      const filePaths = await showOpenDialog(MEDIA_FILTERS, true)
      if (filePaths)
        dispatch(actions.addMediaToProjectRequest(currentProjectId, filePaths))
    },
    [dispatch, currentProjectId]
  )
  const toggleLoop = useCallback(() => dispatch(actions.toggleLoop()), [
    dispatch,
  ])

  const popover = usePopover()

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
    const player = document.getElementById('audioPlayer') as
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

  return (
    <DarkTheme>
      <section className={className} ref={popover.anchorCallbackRef}>
        {projectMediaFiles.length > 0 ? (
          <span className="mediaFileName" title={currentFileName || undefined}>
            <Button
              className={css.audioButton}
              onClick={popover.open}
              id={testLabels.mediaFilesMenuButton}
            >
              {currentFileName
                ? truncate(currentFileName, 40)
                : 'Select media file'}
            </Button>

            {popover.isOpen && (
              <Popover
                anchorEl={popover.anchorEl}
                open={popover.isOpen}
                onClose={popover.close}
              >
                <MenuList style={{ maxHeight: '20.5em', overflowY: 'auto' }}>
                  {projectMediaFiles.map(media => (
                    <MediaFileMenuItem
                      key={media.id}
                      closeMenu={popover.close}
                      mediaFile={media}
                      selected={media.id === currentFileId}
                      currentProjectId={currentProjectId}
                    />
                  ))}
                </MenuList>
                <Divider />
                <MenuItem dense>
                  <ListItemText
                    onClick={chooseMediaFiles}
                    id={testLabels.addNewAdditionalMediaButton}
                  >
                    Add new media
                  </ListItemText>
                </MenuItem>
              </Popover>
            )}
          </span>
        ) : (
          <Button
            id={testLabels.chooseFirstMediaFileButton}
            onClick={chooseMediaFiles}
          >
            Choose media file
          </Button>
        )}
        {currentFileId && (
          <Tooltip title="Loop audio (Ctrl + L)">
            <IconButton
              onClick={toggleLoop}
              color={loop ? 'primary' : 'default'}
            >
              <Loop />
            </IconButton>
          </Tooltip>
        )}
        {currentFileId && (
          <Tooltip
            title={playing ? 'Pause (Ctrl + space)' : 'Play (Ctrl + space)'}
          >
            <IconButton onClick={playOrPauseAudio}>
              {playing ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>
        )}
      </section>
    </DarkTheme>
  )
}

export default MediaFilesNavMenu
