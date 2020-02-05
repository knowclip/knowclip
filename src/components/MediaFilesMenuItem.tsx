import React, { useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  IconButton,
  Tooltip,
  MenuItem,
  MenuList,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Menu,
} from '@material-ui/core'
import {
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  PlayArrow,
  FolderSpecial,
} from '@material-ui/icons'
import usePopover from '../utils/usePopover'
import truncate from '../utils/truncate'
import * as r from '../redux'
import * as actions from '../actions'
import css from './MainHeader.module.css'

const CONFIRM_DELETE_MEDIA_FROM_PROJECT_MESSAGE =
  'Are you sure you want to remove this media file? This action will delete any flashcards you might have made with it.'

type MediaFileMenuItemProps = {
  mediaFile: MediaFile
  selected: boolean
  currentProjectId: ProjectId
  closeMenu: (event: React.SyntheticEvent<Element, Event>) => void
  className?: string
}

const submenuAnchorOrigin = { vertical: 'top', horizontal: 'right' } as const
const MediaFilesMenuItem = ({
  mediaFile,
  selected,
  currentProjectId,
  closeMenu: closeSupermenu,
  className,
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
        actions.fileSelectionDialog('Please locate this media file.', mediaFile)
      )
      closeMenu(e)
    },
    [dispatch, mediaFile, closeMenu]
  )
  const { fileAvailability } = useSelector((state: AppState) => ({
    fileAvailability: r.getFileAvailability(state, mediaFile),
  }))
  const needsFilePath = !fileAvailability.filePath
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
      className={className}
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
        anchorOrigin={submenuAnchorOrigin}
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
          <MenuItem dense onClick={loadAndClose}>
            <ListItemIcon>
              <PlayArrow />
            </ListItemIcon>
            <ListItemText>Open</ListItemText>
          </MenuItem>
          <MenuItem dense onClick={deleteAndClose}>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
          <MenuItem dense onClick={locateAndClose}>
            <ListItemIcon>
              <FolderSpecial />
            </ListItemIcon>
            <ListItemText>Manually locate in file system</ListItemText>
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

export default MediaFilesMenuItem
