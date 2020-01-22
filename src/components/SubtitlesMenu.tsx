import React, { Fragment, useCallback } from 'react'
import {
  Subtitles as SubtitlesIcon,
  Visibility as VisibilityOnIcon,
  VisibilityOff as VisibilityOffIcon,
  MoreVert,
  FolderSpecial,
  Delete as DeleteIcon,
} from '@material-ui/icons'
import { useDispatch, useSelector } from 'react-redux'
import * as r from '../redux'
import * as actions from '../actions'
import {
  IconButton,
  Icon,
  Tooltip,
  Menu,
  MenuItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Divider,
} from '@material-ui/core'
import { showOpenDialog } from '../utils/electron'
import css from './MainHeader.module.css'
import usePopover from '../utils/usePopover'

const testLabels = {
  openMenuButton: 'subtitles-menu-open-menu-button',
  trackMenuItem: 'subtitles-menu-track-item',
} as const

const SubtitlesMenu = () => {
  const { anchorEl, anchorCallbackRef, open, close, isOpen } = usePopover()

  const { subtitles, currentFileId } = useSelector((state: AppState) => {
    const currentFileId = r.getCurrentFileId(state)
    return {
      subtitles: currentFileId ? r.getSubtitlesFilesWithTracks(state) : [],
      currentFileId,
    }
  })

  const dispatch = useDispatch()

  const subtitlesClipsDialogRequest = useCallback(
    e => {
      dispatch(actions.subtitlesClipsDialogRequest())
    },
    [dispatch]
  )

  return (
    <Fragment>
      <Tooltip title="Subtitles">
        <IconButton
          buttonRef={anchorCallbackRef}
          onClick={open}
          id={testLabels.openMenuButton}
        >
          <SubtitlesIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={isOpen} onClose={close}>
        {!subtitles.length && (
          <MenuItem dense disabled>
            No subtitles loaded.
          </MenuItem>
        )}
        {subtitles
          .filter(s => s.relation.type === 'EmbeddedSubtitlesTrack')
          .map(({ relation, file, track }, i) => (
            <EmbeddedTrackMenuItem
              key={relation.id}
              id={relation.id}
              file={
                file as
                  | (VttConvertedSubtitlesFile & { parentType: 'MediaFile' })
                  | null
              }
              track={track as EmbeddedSubtitlesTrack}
              title={`Embedded track ${i + 1}`}
            />
          ))}
        {subtitles
          .filter(s => s.relation.type === 'ExternalSubtitlesTrack')
          .map(({ relation, file, track }, i) => (
            <ExternalTrackMenuItem
              key={relation.id}
              id={relation.id}
              track={track as ExternalSubtitlesTrack}
              file={file as ExternalSubtitlesFile}
              title={`External track ${i + 1}`}
            />
          ))}
        <Divider />
        <MenuItem
          dense
          onClick={useCallback(
            async () => {
              if (!currentFileId)
                return dispatch(
                  actions.simpleMessageSnackbar(
                    'Please open a media file first.'
                  )
                )

              const filePaths = await showOpenDialog([
                { name: 'Subtitles', extensions: ['srt', 'ass', 'vtt'] },
              ])
              if (!filePaths) return

              dispatch(
                actions.loadSubtitlesFromFileRequest(
                  filePaths[0],
                  currentFileId
                )
              )
            },
            [dispatch, currentFileId]
          )}
        >
          <ListItemText primary="Load external track" />
        </MenuItem>
        <MenuItem dense onClick={subtitlesClipsDialogRequest}>
          <ListItemText primary="Make clips + cards from subtitles" />
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

const VisibilityIcon = ({ visible }: { visible: boolean }) => (
  <Icon>
    {visible ? (
      <VisibilityOnIcon fontSize="small" />
    ) : (
      <VisibilityOffIcon fontSize="small" />
    )}
  </Icon>
)

const EmbeddedTrackMenuItem = ({
  id,
  file,
  track,
  title,
}: {
  id: string
  file: VttConvertedSubtitlesFile & { parentType: 'MediaFile' } | null
  track: EmbeddedSubtitlesTrack | null
  title: string
}) => (
  <MenuItem dense onClick={useToggleVisible(track, id)}>
    <ListItemIcon>
      {track ? (
        <VisibilityIcon visible={Boolean(track.mode === 'showing')} />
      ) : (
        <Tooltip title="Problem reading embedded subtitles">
          <FolderSpecial />
        </Tooltip>
      )}
    </ListItemIcon>
    <ListItemText className={css.subtitlesMenuListItemText} primary={title} />
  </MenuItem>
)

const ExternalTrackMenuItem = ({
  id,
  file,
  track,
  title,
}: {
  id: SubtitlesTrackId
  file: ExternalSubtitlesFile | null
  track: ExternalSubtitlesTrack | null
  title: string
}) => {
  const { anchorEl, anchorCallbackRef, open, close, isOpen } = usePopover()
  const dispatch = useDispatch()

  const deleteExternalSubtitles = useCallback(
    e => {
      dispatch(actions.deleteFileRequest('ExternalSubtitlesFile', id))
    },
    [dispatch, id]
  )

  const locateFileRequest = useCallback(
    e => {
      if (file)
        dispatch(
          actions.locateFileRequest(
            file,
            `Locate "${file.name}" in your filesystem to use these subtitles.`
          )
        )
    },
    [dispatch, file]
  )

  const toggleVisible = useToggleVisible(track, id)

  return (
    <MenuItem dense onClick={toggleVisible} disabled={!file}>
      <ListItemIcon>
        {track ? (
          <VisibilityIcon
            visible={Boolean(track && track.mode === 'showing')}
          />
        ) : (
          <Tooltip title="Not found in filesystem">
            <FolderSpecial />
          </Tooltip>
        )}
      </ListItemIcon>
      <ListItemText className={css.subtitlesMenuListItemText} primary={title} />
      <Menu open={isOpen} onClose={close} anchorEl={anchorEl}>
        <MenuItem dense onClick={locateFileRequest} disabled={!file}>
          <ListItemIcon>
            <Icon>
              <FolderSpecial />
            </Icon>
          </ListItemIcon>
          <ListItemText primary="Locate subtitles file in filesystem" />
        </MenuItem>
        <MenuItem dense disabled={!file} onClick={deleteExternalSubtitles}>
          <ListItemIcon>
            <Icon>
              <DeleteIcon />
            </Icon>
          </ListItemIcon>
          <ListItemText primary="Remove subtitles track" />
        </MenuItem>
      </Menu>
      <ListItemSecondaryAction>
        <IconButton buttonRef={anchorCallbackRef} onClick={open}>
          <MoreVert />
        </IconButton>
      </ListItemSecondaryAction>
    </MenuItem>
  )
}

function useToggleVisible(track: SubtitlesTrack | null, id: string) {
  const dispatch = useDispatch()
  return useCallback(
    e => {
      if (track)
        dispatch(
          track.mode === 'showing'
            ? actions.hideSubtitles(id, track.mediaFileId)
            : actions.showSubtitles(id, track.mediaFileId)
        )
    },
    [dispatch, id, track]
  )
}

export default SubtitlesMenu
