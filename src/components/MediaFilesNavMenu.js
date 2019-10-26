import React, { useCallback, useState, useRef, useEffect } from 'react'
import { connect } from 'react-redux'
import {
  Button,
  IconButton,
  Tooltip,
  MenuItem,
  MenuList,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Popover,
} from '@material-ui/core'
import {
  Loop,
  Delete as DeleteIcon,
  PlayArrow,
  Pause,
} from '@material-ui/icons'
import DarkTheme from './DarkTheme'
import { showOpenDialog } from '../utils/electron'
import truncate from '../utils/truncate'
import * as r from '../redux'
import css from './Header.module.css'

const CONFIRM_DELETE_MEDIA_FROM_PROJECT_MESSAGE =
  'Are you sure you want to remove this media file? This action will delete any flashcards you might have made with it.'

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

  const menuAnchorEl = useRef(null)
  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const openMenu = e => setMenuIsOpen(true)
  const closeMenu = e => setMenuIsOpen(false)

  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const startPlaying = () => setPlaying(true)

    document.addEventListener('play', startPlaying, true)
    return () => document.removeEventListener('play', startPlaying)
  }, [])
  useEffect(() => {
    const stopPlaying = () => setPlaying(false)

    document.addEventListener('pause', stopPlaying, true)
    return () => document.removeEventListener('pause', stopPlaying)
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
                anchorEl={menuAnchorEl.current}
                open={menuIsOpen}
                onClose={closeMenu}
              >
                <MenuList style={{ maxHeight: '40em', overflowY: 'auto' }}>
                  {projectMediaFiles.map(media => (
                    <MenuItem
                      dense
                      key={media.id}
                      selected={media.id === currentFileId}
                      onClick={() => loadFileRequest(media)}
                    >
                      <ListItemText
                        title={media.name}
                        className={css.mediaFilesMenuListItemText}
                      >
                        {truncate(media.name, 40)}
                      </ListItemText>
                      <ListItemSecondaryAction>
                        <IconButton
                          onClick={() =>
                            confirmationDialog(
                              CONFIRM_DELETE_MEDIA_FROM_PROJECT_MESSAGE,
                              r.deleteMediaFromProjectRequest(
                                currentProjectId,
                                media.id
                              )
                            )
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </MenuItem>
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
  deleteMediaFromProjectRequest: r.deleteMediaFromProjectRequest,
  confirmationDialog: r.confirmationDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MediaFilesNavMenu)
