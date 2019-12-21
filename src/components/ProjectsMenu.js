import React, { Fragment, useRef, useState } from 'react'
import { connect } from 'react-redux'
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
import css from './ProjectsMenu.module.css'
import { showOpenDialog } from '../utils/electron'

const getOpenProjectByFilePath = openProjectByFilePath => async () => {
  const filePaths = await showOpenDialog({
    name: 'AFCA project file',
    extensions: ['afca'],
  })

  if (filePaths) {
    openProjectByFilePath(filePaths[0])
  }
}

const ProjectMenuItem = ({
  project,
  openProjectById,
  removeProjectFromRecents,
}) => {
  const menuAnchorEl = useRef(null)
  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const openMenu = e => {
    setMenuIsOpen(true)
    e.stopPropagation()
  }
  const closeMenu = e => {
    e.stopPropagation()
    setMenuIsOpen(false)
  }

  return (
    <Fragment>
      {menuIsOpen && (
        <Menu
          open={menuIsOpen}
          onClose={closeMenu}
          anchorEl={menuAnchorEl.current}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={e => removeProjectFromRecents(project.id)}>
            Remove from recents
          </MenuItem>
        </Menu>
      )}
      <MenuItem key={project.id} onClick={() => openProjectById(project.id)}>
        <RootRef rootRef={menuAnchorEl}>
          <ListItemText>{project.name}</ListItemText>
        </RootRef>
        <IconButton onClick={openMenu}>
          <MoreVertIcon />
        </IconButton>
      </MenuItem>
    </Fragment>
  )
}

const ProjectsMenu = ({
  currentProjectId,
  projects,
  openProjectById,
  newProjectFormDialog,
  openProjectByFilePath,
  removeProjectFromRecents,
}) => {
  const handleClickNewProject = useRef(newProjectFormDialog)
  const onClickOpenExisting = useRef(
    getOpenProjectByFilePath(openProjectByFilePath)
  )

  if (currentProjectId) return <Redirect to="/" />

  return (
    <section className="App">
      <header className={css.header}>
        <h1 className={css.mainHeading}>Audio Flashcard Assistant</h1>
      </header>
      <section className={css.main}>
        <section className={css.menu}>
          <Paper className={css.recentProjectsPaper}>
            <MenuList>
              {projects.length ? null : (
                <MenuItem disabled>No recent projects.</MenuItem>
              )}
              {projects.map(project => (
                <ProjectMenuItem
                  key={project.id}
                  project={project}
                  openProjectById={openProjectById}
                  removeProjectFromRecents={removeProjectFromRecents}
                />
              ))}
            </MenuList>
          </Paper>

          <section className={css.buttons}>
            <Button
              className={css.button}
              variant="contained"
              color="primary"
              onClick={handleClickNewProject.current}
            >
              New project
            </Button>
            <Button
              className={css.button}
              variant="contained"
              color="primary"
              onClick={onClickOpenExisting.current}
            >
              Open existing project
            </Button>
          </section>
        </section>
      </section>
    </section>
  )
}

const mapStateToProps = state => ({
  projects: r.getProjects(state),
  currentProjectId: r.getCurrentProjectId(state),
})

const mapDispatchToProps = {
  openProjectByFilePath: r.openProjectByFilePath,
  openProjectById: r.openProjectById,
  newProjectFormDialog: r.newProjectFormDialog,
  removeProjectFromRecents: r.removeProjectFromRecents,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectsMenu)
