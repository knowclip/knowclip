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
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  Menu,
  MenuList,
  MenuItem,
  ListItemText,
  ListItemSecondaryAction,
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
  console.log(filePaths)
  if (!filePaths) return

  loadSubtitlesFromFile(filePaths[0])
}

const SubtitlesMenu = ({
  embeddedTracks,
  externalTracks,
  showSubtitles,
  hideSubtitles,
  loadSubtitlesFromFile,
}) => {
  const menuAnchorEl = useRef(null)
  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const openMenu = e => setMenuIsOpen(true)
  const closeMenu = e => setMenuIsOpen(false)

  return (
    <Fragment>
      <Tooltip title="subtitles">
        <IconButton buttonRef={menuAnchorEl} onClick={openMenu}>
          <SubtitlesIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={menuAnchorEl.current}
        open={menuIsOpen}
        onClose={closeMenu}
      >
        {embeddedTracks.map((track, i) => (
          <MenuItem dense key={track.id}>
            <ListItemText
              className={css.subtitlesMenuListItem}
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
              className={css.subtitlesMenuListItem}
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
        <MenuItem dense onClick={getOnClickLoadExternal(loadSubtitlesFromFile)}>
          <ListItemText primary="Load external track" />
        </MenuItem>
      </Menu>
    </Fragment>
  )
}
export const getExternalSubtitlesTracks = state =>
  state.subtitles.loadedTracks.filter(
    track => track.type === 'ExternalSubtitlesTrack'
  )

const mapStateToProps = state => ({
  embeddedTracks: r.getEmbeddedSubtitlesTracks(state),
  externalTracks: getExternalSubtitlesTracks(state),
})

const mapDispatchToProps = {
  showSubtitles: r.showSubtitles,
  hideSubtitles: r.hideSubtitles,
  loadSubtitlesFromFile: r.loadSubtitlesFromFileRequest,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SubtitlesMenu)
