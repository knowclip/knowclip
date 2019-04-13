import React, { useRef, useState } from 'react'
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
import { remote } from 'electron'

const { dialog } = remote

const getOpenProjectByFilePath = openProjectByFilePath => () =>
  dialog.showOpenDialog(
    {
      properties: ['openFile'],
      filters: [{ name: 'AFCA project file', extensions: ['afca'] }],
    },
    filePaths => {
      if (filePaths) {
        openProjectByFilePath(filePaths[0])
      }
    }
  )

const ProjectMenuItem = ({
  projectMetadata,
  openProjectById,
  removeProjectFromRecents,
}) => {
  const menuAnchorEl = useRef(null)
  const [menuIsOpen, setMenuIsOpen] = useState(false)
  const openMenu = e => setMenuIsOpen(true)
  const closeMenu = e => setMenuIsOpen(false)

  return (
    <MenuItem key={projectMetadata.id}>
      <RootRef rootRef={menuAnchorEl}>
        <ListItemText onClick={() => openProjectById(projectMetadata.id)}>
          {projectMetadata.name}
        </ListItemText>
      </RootRef>
      <IconButton onClick={openMenu}>
        <MoreVertIcon />
      </IconButton>
      {menuIsOpen && (
        <Menu
          open={menuIsOpen}
          onClose={closeMenu}
          anchorEl={menuAnchorEl.current}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={e => removeProjectFromRecents(projectMetadata.id)}>
            Remove from recents
          </MenuItem>
        </Menu>
      )}
    </MenuItem>
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
              {projects.map(projectMetadata => (
                <ProjectMenuItem
                  key={projectMetadata.id}
                  projectMetadata={projectMetadata}
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
