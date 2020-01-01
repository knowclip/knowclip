import React, { Fragment } from 'react'
import {
  Subtitles as SubtitlesIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@material-ui/icons'
import { connect } from 'react-redux'
import * as r from '../redux'
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@material-ui/core'
import { showOpenDialog } from '../utils/electron'
import css from './Header.module.css'
import usePopover from '../utils/usePopover'

const VisibilityButton = ({ visible, showSubtitles, hideSubtitles }) => (
  <IconButton onClick={visible ? hideSubtitles : showSubtitles}>
    {visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
  </IconButton>
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

const SubtitlesMenu = ({
  embeddedTracks,
  externalTracks,
  showSubtitles,
  hideSubtitles,
  loadSubtitlesFromFile,
  subtitlesClipsDialogRequest,
  currentFileId,
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
        {!(embeddedTracks.length + externalTracks.length) && (
          <MenuItem dense disabled>
            No subtitles loaded.
          </MenuItem>
        )}
        {embeddedTracks.map((track, i) => (
          <MenuItem dense key={track.id}>
            <ListItemText
              className={css.subtitlesMenuListItemText}
              primary={`Embedded track ${i + 1}`}
            />
            <ListItemSecondaryAction>
              <VisibilityButton
                visible={track.mode === 'showing'}
                showSubtitles={() => showSubtitles(track.id, currentFileId)}
                hideSubtitles={() => hideSubtitles(track.id, currentFileId)}
              />
            </ListItemSecondaryAction>
          </MenuItem>
        ))}
        {externalTracks.map((track, i) => (
          <MenuItem dense key={track.id}>
            <ListItemText
              className={css.subtitlesMenuListItemText}
              primary={`External track ${i + 1}`}
            />
            <ListItemSecondaryAction>
              <VisibilityButton
                visible={track.mode === 'showing'}
                showSubtitles={() => showSubtitles(track.id, currentFileId)}
                hideSubtitles={() => hideSubtitles(track.id, currentFileId)}
              />
            </ListItemSecondaryAction>
          </MenuItem>
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
  externalTracks: r.getExternalSubtitlesTracks(state),
  currentFileId: r.getCurrentFileId(state),
})

const mapDispatchToProps = {
  showSubtitles: r.showSubtitles,
  hideSubtitles: r.hideSubtitles,
  loadSubtitlesFromFile: r.loadSubtitlesFromFileRequest,
  subtitlesClipsDialogRequest: r.subtitlesClipsDialogRequest,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SubtitlesMenu)
