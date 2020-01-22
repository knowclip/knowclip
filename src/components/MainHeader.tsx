import React, { Fragment, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { IconButton, Tooltip } from '@material-ui/core'
import {
  Hearing as HearingIcon,
  Delete as DeleteIcon,
} from '@material-ui/icons'
import MediaFilesMenu from '../components/MediaFilesMenu'
import ProjectMenu from '../components/ProjectMenu'
import headerCss from '../components/MainHeader.module.css'
import * as actions from '../actions'
import SubtitlesMenu from '../components/SubtitlesMenu'

export const testLabels = {
  container: 'main-screen-header',
} as const

const MainHeader = ({
  currentProjectId,
  currentMediaFile,
}: {
  currentProjectId: string
  currentMediaFile: MediaFile | null
}) => {
  const dispatch = useDispatch()
  const detectSilenceRequest = useCallback(
    () => dispatch(actions.detectSilenceRequest()),
    [dispatch]
  )
  const deleteAllCurrentFileClipsRequest = useCallback(
    () => dispatch(actions.deleteAllCurrentFileClipsRequest()),
    [dispatch]
  )
  return (
    <header className={headerCss.container}>
      <ProjectMenu className={headerCss.block} />
      <section className={headerCss.block}>
        <MediaFilesMenu
          className={headerCss.leftMenu}
          currentProjectId={currentProjectId}
        />
      </section>
      <ul className={headerCss.rightMenu}>
        {currentMediaFile && (
          <Fragment>
            <li className={headerCss.menuItem}>
              <SubtitlesMenu />
            </li>
            <li className={headerCss.menuItem}>
              <Tooltip title="Detect silences">
                <IconButton onClick={detectSilenceRequest}>
                  <HearingIcon />
                </IconButton>
              </Tooltip>
            </li>
            <li className={headerCss.menuItem}>
              <Tooltip title="Delete all clips for this media">
                <IconButton onClick={deleteAllCurrentFileClipsRequest}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </li>
          </Fragment>
        )}
      </ul>
    </header>
  )
}

export default MainHeader
