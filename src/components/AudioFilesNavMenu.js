import React, { Component, useCallback, useState, useRef, useMemo } from 'react'
import { connect } from 'react-redux'
import {
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@material-ui/core'
import {
  Close as CloseIcon,
  Loop,
  Delete as DeleteIcon,
} from '@material-ui/icons'
import DarkTheme from './DarkTheme'
import { showOpenDialog } from '../utils/electron'
import truncate from '../utils/truncate'
import * as r from '../redux'
import css from './Header.module.css'

import { AppContainer, setConfig, cold } from 'react-hot-loader'

setConfig({
  onComponentCreate: (type, name) => cold(type),
})

const CONFIRM_DELETE_MEDIA_FROM_PROJECT_MESSAGE =
  'Are you sure you want to remove this media file? This action will delete any flashcards you might have made with it.'

const AudioFilesNavMenu = ({
  className,
  toggleLoop,
  currentFileName,
  currentFileId,
  loop,
  addMediaToProjectRequest,
  currentProjectId,
  projectMediaMetadata,
  openMediaFileRequest,
  confirmationDialog,
  deleteMedia,
}) => {
  const chooseAudioFiles = useCallback(
    async () => {
      const filters = [{ name: 'Audio or video files' }]
      const filePaths = await showOpenDialog(filters, true)
      if (filePaths) addMediaToProjectRequest(currentProjectId, filePaths)
    },
    [addMediaToProjectRequest, currentProjectId]
  )
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const openMenu = e => {
    setMenuAnchorEl(e.currentTarget)
  }
  const closeMenu = () => {
    setMenuAnchorEl(null)
  }

  return (
    <DarkTheme>
      <section className={className} ref={menuAnchorEl}>
        {projectMediaMetadata.length > 0 ? (
          <span className="audioFileName" title={currentFileName}>
            <Button className={css.audioButton} onClick={openMenu}>
              {currentFileName ? truncate(currentFileName, 30) : 'Select media'}
            </Button>

            {Boolean(menuAnchorEl) && (
              <Menu
                anchorEl={menuAnchorEl || document.body}
                open={Boolean(menuAnchorEl)}
                onClose={closeMenu}
              >
                {projectMediaMetadata.map(({ name, id }) => (
                  <MenuItem
                    key={id}
                    selected={id === currentFileId}
                    onClick={() => openMediaFileRequest(id)}
                  >
                    <ListItemText title={name}>
                      {truncate(name, 30)}
                    </ListItemText>
                    <ListItemSecondaryAction>
                      <IconButton
                        onClick={() =>
                          confirmationDialog(
                            CONFIRM_DELETE_MEDIA_FROM_PROJECT_MESSAGE,
                            r.deleteMedia(currentProjectId, id)
                          )
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </MenuItem>
                ))}
                <MenuItem onClick={chooseAudioFiles}>
                  <ListItemText>Add new media</ListItemText>
                </MenuItem>
              </Menu>
            )}
            {/* <IconButton onClick={removeAudioFiles}>
                <CloseIcon />
              </IconButton> */}
          </span>
        ) : (
          <Button onClick={chooseAudioFiles}>Choose source file</Button>
        )}
        <Tooltip title="Loop audio">
          <IconButton onClick={toggleLoop} color={loop ? 'primary' : 'default'}>
            <Loop />
          </IconButton>
        </Tooltip>{' '}
      </section>
    </DarkTheme>
  )
}

const mapStateToProps = state => ({
  loop: r.isLoopOn(state),
  currentFileName: r.getCurrentFileName(state),
  currentFileId: r.getCurrentFileId(state),
  currentProjectId: r.getCurrentProjectId(state),
  projectMediaMetadata: r.getProjectMediaMetadata(
    state,
    r.getCurrentProjectId(state)
  ),
})

const mapDispatchToProps = {
  toggleLoop: r.toggleLoop,
  addMediaToProjectRequest: r.addMediaToProjectRequest,
  openMediaFileRequest: r.openMediaFileRequest,
  deleteMedia: r.deleteMedia,
  confirmationDialog: r.confirmationDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AudioFilesNavMenu)

// <IconButton onClick={onClickPrevious} disabled={!isPrevButtonEnabled}>
//   <FastRewind />
// </IconButton>
// <IconButton onClick={onClickNext} disabled={!isNextButtonEnabled}>
//   <FastForward />
// </IconButton>
