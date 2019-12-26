import React, { useCallback, useState, useRef, useEffect } from 'react'
import { connect, useSelector } from 'react-redux'
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
import css from './Header.module.css'

const CONFIRM_DELETE_MEDIA_FROM_PROJECT_MESSAGE =
  'Are you sure you want to remove this media file? This action will delete any flashcards you might have made with it.'

const MediaFileMenuItem = ({
  mediaFile,
  selected,
  loadMediaFileRequest,
  locateMediaFileRequest,
  deleteMediaFile,
  closeMenu: closeSupermenu,
}) => {
  const submenu = usePopover()

  const closeMenu = useRef(e => {
    submenu.close(e)
    closeSupermenu(e)
  }).current

  const loadAndClose = useRef(e => {
    loadMediaFileRequest()
    closeMenu(e)
  }).current
  const deleteAndClose = useRef(e => {
    deleteMediaFile()
    closeMenu(e)
  }).current
  const locateAndClose = useRef(e => {
    locateMediaFileRequest()
    closeMenu(e)
  }).current
  const { fileAvailability } = useSelector(state => ({
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
      {needsFilePath ? (
        <Tooltip title="Not found in file system">{actionsButton}</Tooltip>
      ) : (
        actionsButton
      )}
      <Menu
        open={submenu.isOpen}
        anchorEl={submenu.anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={e => {
          e.stopPropagation()
          submenu.close(e)
        }}
        onClick={e => {
          e.stopPropagation()
        }}
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
    </MenuItem>
  )
}

const MediaFilesNavMenu = ({
  className,
  toggleLoop,
  currentFileName,
  currentFileId,
  loop,
  addMediaToProjectRequest,
  currentProjectId,
  projectMediaFiles,
  openFileRequest,
  locateFileRequest,
  confirmationDialog,
  deleteMediaFromProjectRequest,
}) => {
  const chooseMediaFiles = useCallback(
    async () => {
      const filters = [{ name: 'Audio or video files' }]
      const filePaths = await showOpenDialog(filters, true)
      if (filePaths) addMediaToProjectRequest(currentProjectId, filePaths)
    },
    [addMediaToProjectRequest, currentProjectId]
  )

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

  const playOrPauseAudio = useRef(() => {
    const player = document.getElementById('audioPlayer')
    player.paused ? player.play() : player.pause()
  })

  useEffect(() => {
    const resetPlayButton = () => setPlaying(false)
    document.addEventListener('loadeddata', resetPlayButton, true)
    return () => document.removeEventListener('loadeddata', resetPlayButton)
  }, [])

  return (
    <DarkTheme>
      <section className={className} ref={popover.anchorCallbackRef}>
        {projectMediaFiles.length > 0 ? (
          <span className="mediaFileName" title={currentFileName}>
            <Button className={css.audioButton} onClick={popover.open}>
              {currentFileName ? truncate(currentFileName, 40) : 'Select media'}
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
                      closeMenu={popover.close}
                      mediaFile={media}
                      selected={media.id === currentFileId}
                      loadMediaFileRequest={() => openFileRequest(media)}
                      locateMediaFileRequest={() =>
                        locateFileRequest(
                          media,
                          'Please locate this media file.'
                        )
                      }
                      deleteMediaFile={() =>
                        confirmationDialog(
                          CONFIRM_DELETE_MEDIA_FROM_PROJECT_MESSAGE,
                          r.deleteMediaFromProjectRequest(
                            currentProjectId,
                            media.id
                          )
                        )
                      }
                    />
                  ))}
                </MenuList>
                <Divider />
                <MenuItem dense>
                  <ListItemText onClick={chooseMediaFiles}>
                    Add new media
                  </ListItemText>
                </MenuItem>
              </Popover>
            )}
          </span>
        ) : (
          <Button onClick={chooseMediaFiles}>Choose source file</Button>
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
            <IconButton onClick={playOrPauseAudio.current}>
              {playing ? <Pause /> : <PlayArrow />}
            </IconButton>
          </Tooltip>
        )}
      </section>
    </DarkTheme>
  )
}

const mapStateToProps = state => ({
  loop: r.isLoopOn(state),
  currentFileName: r.getCurrentFileName(state),
  currentFileId: r.getCurrentFileId(state),
  currentProjectId: r.getCurrentProjectId(state),
  projectMediaFiles: r.getCurrentProjectMediaFiles(state),
})

const mapDispatchToProps = {
  toggleLoop: r.toggleLoop,
  addMediaToProjectRequest: r.addMediaToProjectRequest,
  openFileRequest: r.openFileRequest,
  locateFileRequest: r.locateFileRequest,
  deleteMediaFromProjectRequest: r.deleteMediaFromProjectRequest,
  confirmationDialog: r.confirmationDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MediaFilesNavMenu)
