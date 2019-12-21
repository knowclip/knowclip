import React, { useCallback, useState, useRef, useEffect } from 'react'
import { connect } from 'react-redux'
import {
  Button,
  IconButton,
  Icon,
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
  Search,
  FolderSpecial,
} from '@material-ui/icons'
import DarkTheme from './DarkTheme'
import { showOpenDialog } from '../utils/electron'
import truncate from '../utils/truncate'
import * as r from '../redux'
import css from './Header.module.css'

const CONFIRM_DELETE_MEDIA_FROM_PROJECT_MESSAGE =
  'Are you sure you want to remove this media file? This action will delete any flashcards you might have made with it.'

const usePopover = () => {
  const [menuAnchorEl, setAnchorEl] = useState(null)
  const openMenu = useRef(event => {
    setAnchorEl(event.currentTarget)
  }).current
  const closeMenu = useRef(() => {
    setAnchorEl(null)
  }).current
  const isOpen = Boolean(menuAnchorEl)
  const toggleMenu = isOpen ? closeMenu : openMenu
  return {
    menuAnchorEl,
    setAnchorEl,
    openMenu,
    closeMenu,
    toggleMenu,
    isOpen,
  }
}

const MediaFileMenuItem = ({
  mediaFile,
  selected,
  loadMediaFileRequest,
  locateMediaFileRequest,
  deleteMediaFile,
  closeMenu: closeSupermenu,
}) => {
  const {
    menuAnchorEl,
    toggleMenu,
    closeMenu: closeSubmenu,
    isOpen,
  } = usePopover()

  const closeMenu = useRef(() => {
    closeSubmenu()
    closeSupermenu()
  }).current

  const loadAndClose = useRef(() => {
    loadMediaFileRequest()
    closeMenu()
  }).current
  const deleteAndClose = useRef(() => {
    deleteMediaFile()
    closeMenu()
  }).current
  const locateAndClose = useRef(() => {
    locateMediaFileRequest()
    closeMenu()
  }).current

  return (
    <MenuItem
      dense
      key={mediaFile.id}
      selected={selected}
      onClick={loadAndClose}
      ref={menuAnchorEl}
    >
      <ListItemText
        title={mediaFile.name}
        className={css.mediaFilesMenuListItemText}
      >
        {truncate(mediaFile.name, 40)}
      </ListItemText>
      <ListItemSecondaryAction>
        <IconButton
          onClick={e => {
            e.stopPropagation()
            toggleMenu(e)
          }}
        >
          <MoreVertIcon />
        </IconButton>
      </ListItemSecondaryAction>
      <Menu
        open={isOpen}
        anchorEl={menuAnchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={e => {
          e.stopPropagation()
          closeSubmenu()
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

    // <Menu anchorEl={menuAnchorEl} open={menuIsOpen}>
    //   <MenuItem>Delete</MenuItem>
    // </Menu>
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
  loadFileRequest,
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

  const { menuAnchorEl, openMenu, closeMenu, isOpen: menuIsOpen } = usePopover()

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
      <section className={className} ref={menuAnchorEl}>
        {projectMediaFiles.length > 0 ? (
          <span className="mediaFileName" title={currentFileName}>
            <Button className={css.audioButton} onClick={openMenu}>
              {currentFileName ? truncate(currentFileName, 40) : 'Select media'}
            </Button>

            {menuIsOpen && (
              <Popover
                anchorEl={menuAnchorEl}
                open={menuIsOpen}
                onClose={closeMenu}
              >
                <MenuList style={{ maxHeight: '20em', overflowY: 'auto' }}>
                  {projectMediaFiles.map(media => (
                    <MediaFileMenuItem
                      closeMenu={closeMenu}
                      mediaFile={media}
                      selected={media.id === currentFileId}
                      loadMediaFileRequest={() => loadFileRequest(media)}
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
  projectMediaFiles: r.getCurrentProjectMediaFileRecords(state),
})

const mapDispatchToProps = {
  toggleLoop: r.toggleLoop,
  addMediaToProjectRequest: r.addMediaToProjectRequest,
  loadFileRequest: r.loadFileRequest,
  locateFileRequest: r.locateFileRequest,
  deleteMediaFromProjectRequest: r.deleteMediaFromProjectRequest,
  confirmationDialog: r.confirmationDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MediaFilesNavMenu)
