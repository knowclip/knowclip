import React, { Fragment, useRef, useState } from 'react'
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

const VisibilityButton = ({ visible, showSubtitles, hideSubtitles }) => (
  <IconButton onClick={visible ? hideSubtitles : showSubtitles}>
    {visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
  </IconButton>
)

const getOnClickLoadExternal = loadSubtitlesFromFile => async () => {
  const filePaths = await showOpenDialog([
    { name: 'Subtitles', extensions: ['srt', 'ass', 'vtt'] },
  ])
  if (!filePaths) return

  loadSubtitlesFromFile(filePaths[0])
}

const SubtitlesMenu = ({
  embeddedTracks,
  externalTracks,
  showSubtitles,
  hideSubtitles,
  loadSubtitlesFromFile,
  subtitlesClipsDialogRequest,
}) => {
  const menuAnchorEl = useRef(null)
  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const openMenu = e => setMenuIsOpen(true)
  const closeMenu = e => setMenuIsOpen(false)

  return (
    <Fragment>
      <Tooltip title="Subtitles">
        <IconButton buttonRef={menuAnchorEl} onClick={openMenu}>
          <SubtitlesIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={menuAnchorEl.current}
        open={menuIsOpen}
        onClose={closeMenu}
      >
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
                showSubtitles={() => showSubtitles(track.id)}
                hideSubtitles={() => hideSubtitles(track.id)}
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
                showSubtitles={() => showSubtitles(track.id)}
                hideSubtitles={() => hideSubtitles(track.id)}
              />
            </ListItemSecondaryAction>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem dense onClick={getOnClickLoadExternal(loadSubtitlesFromFile)}>
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
