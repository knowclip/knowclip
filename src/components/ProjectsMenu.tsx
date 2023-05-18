import React, { Fragment, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Paper,
  MenuList,
  MenuItem,
  Button,
  ListItemText,
  IconButton,
  Menu,
  Tooltip,
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { basename, join, dirname } from 'preloaded/path'
import packageJson from '../../package.json'
import r from '../redux'
import { actions } from '../actions'
import css from './ProjectsMenu.module.css'
import mainCss from './Main.module.css'
import { showOpenDialog } from '../utils/electron'
import usePopover from '../utils/usePopover'
import icon from '../icon.png'

enum $ {
  recentProjectsListItem = 'recent-projects-list-item',
  newProjectButton = 'new-project-button',
  openExistingProjectButton = 'open-existing-project-button',
}

const ProjectMenuItem = ({
  availability,
  file,
}: {
  availability: FileAvailability
  file?: ProjectFile
}) => {
  const { anchorEl, open, close, isOpen, anchorCallbackRef } = usePopover()

  const dispatch = useDispatch()
  const removeFromRecents = useCallback(
    () => dispatch(actions.deleteFileRequest('ProjectFile', availability.id)),
    [dispatch, availability.id]
  )
  const navigate = useNavigate()

  const stopPropagation = useCallback((e) => {
    e.stopPropagation()
  }, [])

  return (
    <Fragment>
      {isOpen && (
        <Menu
          onKeyDown={stopPropagation}
          open={isOpen}
          onClose={close}
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={removeFromRecents}>Remove from recents</MenuItem>
        </Menu>
      )}
      <MenuItem
        tabIndex={0}
        className={$.recentProjectsListItem}
        onClick={() => navigate(`/project/${availability.id}`)}
      >
        <ListItemText
          primary={file ? file.name : availability.name}
          secondary={
            availability && (
              <Tooltip title={availability.filePath || ''}>
                <span>
                  {availability.filePath
                    ? join(
                        basename(dirname(availability.filePath)),
                        basename(availability.filePath)
                      )
                    : 'File not found'}
                </span>
              </Tooltip>
            )
          }
        />
        <IconButton onClick={open} ref={anchorCallbackRef}>
          <MoreVertIcon />
        </IconButton>
      </MenuItem>
    </Fragment>
  )
}

const ProjectsMenu = () => {
  console.log('rendering projects menu')
  const { projects, currentProjectId } = useSelector((state: AppState) => ({
    projects: r.getProjects(state),
    currentProjectId: r.getCurrentProjectId(state),
  }))
  const dispatch = useDispatch()
  const handleClickNewProject = useCallback(() => {
    dispatch(actions.newProjectFormDialog())
  }, [dispatch])
  const onClickOpenExisting = useCallback(async () => {
    const filePaths = await showOpenDialog([
      {
        name: 'Knowclip project file',
        extensions: ['kyml'],
      },
    ])

    if (filePaths) {
      dispatch(actions.openProjectRequestByFilePath(filePaths[0]))
    }
  }, [dispatch])

  if (currentProjectId)
    return <Navigate replace to={`/project/${currentProjectId}`} />

  return (
    <section className={mainCss.container}>
      <header className={css.header}>
        <h1 className={css.mainHeading}>
          <img className={css.icon} src={icon} alt="Knowclip icon" /> Knowclip
          <small className={css.versionNumber}>
            {' '}
            {packageJson.version.split('-')[0]}
          </small>
        </h1>
      </header>
      <section className={css.main}>
        <section className={css.menu}>
          <Paper className={css.recentProjectsPaper}>
            <MenuList>
              {projects.length ? null : (
                <MenuItem disabled>No recent projects.</MenuItem>
              )}
              {projects.map(({ availability, file }) => (
                <ProjectMenuItem
                  key={availability.id}
                  availability={availability}
                  file={file}
                />
              ))}
            </MenuList>
          </Paper>

          <section className={css.buttons}>
            <Button
              id={$.newProjectButton}
              className={css.button}
              variant="contained"
              color="primary"
              onClick={handleClickNewProject}
            >
              New project
            </Button>
            <Button
              id={$.openExistingProjectButton}
              className={css.button}
              variant="contained"
              color="primary"
              onClick={onClickOpenExisting}
            >
              Open existing project
            </Button>
          </section>
        </section>
      </section>
    </section>
  )
}

export default ProjectsMenu

export { $ as projectsMenu$ }
