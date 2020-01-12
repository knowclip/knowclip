import React, { Fragment } from 'react'
import {
  Subtitles as SubtitlesIcon,
  Visibility as VisibilityOnIcon,
  VisibilityOff as VisibilityOffIcon,
  MoreVert,
  FolderSpecial,
  Delete as DeleteIcon,
} from '@material-ui/icons'
import { connect } from 'react-redux'
import * as r from '../redux'
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

const VisibilityIcon = ({ visible }) => (
  <Icon>
    {visible ? (
      <VisibilityOnIcon fontSize="small" />
    ) : (
      <VisibilityOffIcon fontSize="small" />
    )}
  </Icon>
)

const getOnClickLoadExternal = (
  loadSubtitlesFromFile,
  getCurrentFileId
) => async () => {
  const filePaths = await showOpenDialog([
    { name: 'Subtitles', extensions: ['srt', 'ass', 'vtt'] },
  ])
  if (!filePaths) return

  loadSubtitlesFromFile(filePaths[0], getCurrentFileId)
}

const ExternalTrackMenuItem = ({
  title,
  visible,
  show,
  hide,
  deleteTrack,
  locateTrack,
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

const SubtitlesMenu = ({
  embeddedTracks,
  externalTracksWithFiles,
  showSubtitles,
  hideSubtitles,
  loadSubtitlesFromFile,
  subtitlesClipsDialogRequest,
  currentFileId,
  deleteExternalSubtitles,
  locateFileRequest,
}) => {
  const { anchorEl, anchorCallbackRef, open, close, isOpen } = usePopover()

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
                ? hideSubtitles(track.id, currentFileId)
                : showSubtitles(track.id, currentFileId)
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
            show={() => showSubtitles(track.id, currentFileId)}
            hide={() => hideSubtitles(track.id, currentFileId)}
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
          onClick={getOnClickLoadExternal(loadSubtitlesFromFile, currentFileId)}
        >
          <ListItemText primary="Load external track" />
        </MenuItem>
        <MenuItem dense onClick={e => subtitlesClipsDialogRequest()}>
          <ListItemText primary="Make clips + cards from subtitles" />
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

const mapStateToProps = state => ({
  embeddedTracks: r.getEmbeddedSubtitlesTracks(state),
  externalTracksWithFiles: r.getExternalSubtitlesTracks(state),
  currentFileId: r.getCurrentFileId(state),
})

const deleteExternalSubtitles = trackId =>
  r.deleteFileRequest('ExternalSubtitlesFile', trackId)

const mapDispatchToProps = {
  showSubtitles: r.showSubtitles,
  hideSubtitles: r.hideSubtitles,
  loadSubtitlesFromFile: r.loadSubtitlesFromFileRequest,
  subtitlesClipsDialogRequest: r.subtitlesClipsDialogRequest,
  deleteExternalSubtitles,
  locateFileRequest: r.locateFileRequest,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SubtitlesMenu)
