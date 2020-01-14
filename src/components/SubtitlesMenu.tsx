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
import css from './Header.module.css'
import usePopover from '../utils/usePopover'

const VisibilityIcon = ({ visible }: { visible: boolean }) => (
  <Icon>
    {visible ? (
      <VisibilityOnIcon fontSize="small" />
    ) : (
      <VisibilityOffIcon fontSize="small" />
    )}
  </Icon>
)

const ExternalTrackMenuItem = ({
  title,
  visible,
  show,
  hide,
  deleteTrack,
  locateTrack,
}: {
  title: string
  visible: boolean
  show: () => void
  hide: () => void
  deleteTrack: () => void
  locateTrack: () => void
}) => {
  const { anchorEl, anchorCallbackRef, open, close, isOpen } = usePopover()
  return (
    <MenuItem dense onClick={visible ? hide : show}>
      <ListItemIcon>
        <VisibilityIcon visible={visible} />
      </ListItemIcon>
      <ListItemText className={css.subtitlesMenuListItemText} primary={title} />
      <Menu open={isOpen} onClose={close} anchorEl={anchorEl}>
        <MenuItem dense>
          <ListItemIcon>
            <Icon>
              <FolderSpecial />
            </Icon>
          </ListItemIcon>
          <ListItemText
            primary="Locate subtitles file in filesystem"
            onClick={locateTrack}
          />
        </MenuItem>
        <MenuItem dense>
          <ListItemIcon>
            <Icon>
              <DeleteIcon />
            </Icon>
          </ListItemIcon>
          <ListItemText
            primary="Remove subtitles track"
            onClick={deleteTrack}
          />
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

const SubtitlesMenu = () => {
  const { anchorEl, anchorCallbackRef, open, close, isOpen } = usePopover()

  const {
    embeddedTracks,
    externalTracksWithFiles,
    currentFileId,
  } = useSelector((state: AppState) => ({
    embeddedTracks: r.getEmbeddedSubtitlesTracks(state),
    externalTracksWithFiles: r.getExternalSubtitlesTracksWithFiles(state),
    currentFileId: r.getCurrentFileId(state),
  }))

  const dispatch = useDispatch()

  const showSubtitles = useCallback(
    (trackId: string, mediaFileId: string) => {
      dispatch(actions.showSubtitles(trackId, mediaFileId))
    },
    [dispatch]
  )
  const hideSubtitles = useCallback(
    (trackId: string, mediaFileId: string) => {
      dispatch(actions.hideSubtitles(trackId, mediaFileId))
    },
    [dispatch]
  )
  const subtitlesClipsDialogRequest = useCallback(
    () => {
      dispatch(actions.subtitlesClipsDialogRequest())
    },
    [dispatch]
  )
  const deleteExternalSubtitles = useCallback(
    (id: string) => {
      dispatch(actions.deleteFileRequest('ExternalSubtitlesFile', id))
    },
    [dispatch]
  )
  const locateFileRequest = useCallback(
    (file: FileMetadata, message: string) => {
      dispatch(actions.locateFileRequest(file, message))
    },
    [dispatch]
  )

  return (
    <Fragment>
      <Tooltip title="Subtitles">
        <IconButton buttonRef={anchorCallbackRef} onClick={open}>
          <SubtitlesIcon />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={isOpen} onClose={close}>
        {!(embeddedTracks.length + externalTracksWithFiles.length) && (
          <MenuItem dense disabled>
            No subtitles loaded.
          </MenuItem>
        )}
        {embeddedTracks.map((track, i) => (
          <MenuItem
            dense
            key={track.id}
            onClick={() =>
              track.mode === 'showing'
                ? hideSubtitles(track.id, track.mediaFileId)
                : showSubtitles(track.id, track.mediaFileId)
            }
          >
            <ListItemIcon>
              <VisibilityIcon visible={track.mode === 'showing'} />
            </ListItemIcon>
            <ListItemText
              className={css.subtitlesMenuListItemText}
              primary={`Embedded track ${i + 1}`}
            />
          </MenuItem>
        ))}
        {externalTracksWithFiles.map(({ track, file }, i) => (
          <ExternalTrackMenuItem
            key={track.id}
            title={`External track ${i + 1}`}
            visible={track.mode === 'showing'}
            show={() => showSubtitles(track.id, track.mediaFileId)}
            hide={() => hideSubtitles(track.id, track.mediaFileId)}
            deleteTrack={() => deleteExternalSubtitles(track.id)}
            locateTrack={() =>
              locateFileRequest(
                file,
                `Locate "${
                  file.name
                }" in your filesystem to use these subtitles.`
              )
            }
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
        <MenuItem dense onClick={() => subtitlesClipsDialogRequest()}>
          <ListItemText primary="Make clips + cards from subtitles" />
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

export default SubtitlesMenu
