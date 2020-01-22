import React, { Fragment, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Redirect } from 'react-router-dom'
import {
  Paper,
  MenuList,
  MenuItem,
  Button,
  ListItemText,
  IconButton,
  Menu,
  RootRef,
} from '@material-ui/core'
import MoreVertIcon from '@material-ui/icons/MoreVert'
import * as r from '../redux'
import * as actions from '../actions'
import css from './ProjectsMenu.module.css'
import mainCss from './Main.module.css'
import { showOpenDialog } from '../utils/electron'
import usePopover from '../utils/usePopover'

export const testLabels = {
  recentProjectsListItem: 'recent-projects-list-item',
  newProjectButton: 'new-project-button',
  openExistingProjectButton: 'open-existing-project-button',
} as const

const ProjectMenuItem = ({ project }: { project: ProjectFile }) => {
  const { anchorEl, anchorCallbackRef, open, close, isOpen } = usePopover()
  const dispatch = useDispatch()
  const removeFromRecents = useCallback(
    () => dispatch(actions.deleteFileRequest('ProjectFile', project.id)),
    [dispatch, project.id]
  )
  const openProjectById = useCallback(
    () => dispatch(actions.openProjectById(project.id)),
    [dispatch, project.id]
  )
  return (
    <Fragment>
      {isOpen && (
        <Menu
          open={isOpen}
          onClose={close}
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={removeFromRecents}>Remove from recents</MenuItem>
        </Menu>
      )}
      <MenuItem
        onClick={openProjectById}
        className={testLabels.recentProjectsListItem}
      >
        <RootRef rootRef={anchorCallbackRef}>
          <ListItemText>{project.name}</ListItemText>
        </RootRef>
        <IconButton onClick={open}>
          <MoreVertIcon />
        </IconButton>
      </MenuItem>
    </Fragment>
  )
}

const ProjectsMenu = () => {
  const { projects, currentProjectId } = useSelector((state: AppState) => ({
    projects: r.getProjects(state),
    currentProjectId: r.getCurrentProjectId(state),
  }))

  const dispatch = useDispatch()
  const handleClickNewProject = useCallback(
    () => {
      dispatch(actions.newProjectFormDialog())
    },
    [dispatch]
  )
  const onClickOpenExisting = useCallback(
    async () => {
      const filePaths = await showOpenDialog([
        {
          name: 'AFCA project file',
          extensions: ['afca'],
        },
      ])

      if (filePaths) {
        dispatch(actions.openProjectByFilePath(filePaths[0]))
      }
    },
    [dispatch]
  )

  if (currentProjectId) return <Redirect to="/" />

  return (
    <section className={mainCss.container}>
      <header className={css.header}>
        <h1 className={css.mainHeading}>Knowclip</h1>
      </header>
      <section className={css.main}>
        <section className={css.menu}>
          <Paper className={css.recentProjectsPaper}>
            <MenuList>
              {projects.length ? null : (
                <MenuItem disabled>No recent projects.</MenuItem>
              )}
              {projects.map(project => (
                <ProjectMenuItem key={project.id} project={project} />
              ))}
            </MenuList>
          </Paper>

          <section className={css.buttons}>
            <Button
              id={testLabels.newProjectButton}
              className={css.button}
              variant="contained"
              color="primary"
              onClick={handleClickNewProject}
            >
              New project
            </Button>
            <Button
              id={testLabels.openExistingProjectButton}
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
