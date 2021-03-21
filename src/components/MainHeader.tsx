import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { IconButton, Tooltip } from '@material-ui/core'
import { Delete } from '@material-ui/icons'
import cn from 'classnames'
import MediaFilesMenu from '../components/MediaFilesMenu'
import ProjectMenu from '../components/ProjectMenu'
import headerCss from '../components/MainHeader.module.css'
import { actions } from '../actions'
import SubtitlesMenu from '../components/SubtitlesMenu'
import { usePlayButtonSync } from './usePlayButtonSync'
import { WaveformInterface } from './useWaveform'
import { usePrevious } from '../utils/usePrevious'

enum $ {
  container = 'main-screen-header',
  hoverArea = 'hover-area',
}

const MainHeader = ({
  currentProjectId,
  currentMediaFile,
  waveform,
}: {
  currentProjectId: string
  currentMediaFile: MediaFile | null
  waveform: WaveformInterface
}) => {
  const dispatch = useDispatch()
  const deleteAllCurrentFileClipsRequest = useCallback(
    () => dispatch(actions.deleteAllCurrentFileClipsRequest()),
    [dispatch]
  )

  const { viewMode } = useSelector((state: AppState) => ({
    viewMode: state.settings.viewMode,
  }))

  const { isShowing, handleHover, handleMouseOut } = useAutoHide(
    currentMediaFile,
    currentProjectId
  )

  const playButtonSync = usePlayButtonSync(waveform.state.pixelsPerSecond)

  return (
    <header
      className={cn(headerCss.container, $.container, {
        [headerCss.horizontal]: viewMode === 'HORIZONTAL',
        [headerCss.isShowing]: isShowing,
      })}
      onMouseEnter={handleHover}
      onMouseLeave={handleMouseOut}
    >
      <ProjectMenu className={headerCss.block} />
      <section className={headerCss.block}>
        <MediaFilesMenu
          className={headerCss.leftMenu}
          currentProjectId={currentProjectId}
          playButtonSync={playButtonSync}
        />
      </section>
      <ul className={headerCss.rightMenu}>
        {currentMediaFile && (
          <Fragment>
            <li className={headerCss.menuItem}>
              <SubtitlesMenu />
            </li>
            {/* <li className={headerCss.menuItem}>
              <Tooltip title="Detect silences">
                <IconButton onClick={detectSilenceRequest}>
                  <HearingIcon />
                </IconButton>
              </Tooltip>
            </li> */}

            <li className={headerCss.menuItem}>
              <Tooltip title="Delete all clips for this media file">
                <IconButton onClick={deleteAllCurrentFileClipsRequest}>
                  <Delete />
                </IconButton>
              </Tooltip>
            </li>
          </Fragment>
        )}
      </ul>
      <div
        className={cn($.hoverArea, headerCss.hoverArea, {
          [headerCss.horizontal]: viewMode === 'HORIZONTAL',
          [headerCss.isShowing]: isShowing,
        })}
      ></div>
    </header>
  )
}

export default MainHeader

export { $ as mainHeader$ }
function useAutoHide(
  currentMediaFile: MediaFile | null,
  currentProjectId: string
) {
  const [forceVisible, setForceVisible] = useState(false)
  const [hovering, setHovering] = useState(false)
  const isShowing = forceVisible || hovering || !currentMediaFile

  const previousProjectId = usePrevious(currentProjectId)
  const previousMediaFileId = usePrevious(currentMediaFile?.id)
  const forceVisibleTimeout = useRef<number | null>(null)
  const currentMediaFileId = currentMediaFile?.id

  const handleHover = useCallback(() => {
    setHovering(true)
  }, [])
  const handleMouseOut = useCallback(() => {
    setHovering(false)
  }, [])
  useEffect(() => {
    if (
      currentProjectId !== previousProjectId ||
      currentMediaFileId !== (previousMediaFileId || null)
    ) {
      setForceVisible(true)
      if (typeof forceVisibleTimeout.current === 'number')
        clearTimeout(forceVisibleTimeout.current)
      const timeout = setTimeout(() => {
        setForceVisible(false)
      }, 1000)
      forceVisibleTimeout.current = (timeout as any) as number
    }
  }, [
    currentMediaFileId,
    currentProjectId,
    previousMediaFileId,
    previousProjectId,
    forceVisibleTimeout,
  ])
  return { isShowing, handleHover, handleMouseOut }
}
