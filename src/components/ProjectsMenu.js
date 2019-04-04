import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { Paper, MenuList, MenuItem, Button } from '@material-ui/core'
import * as r from '../redux'
import css from './ProjectsMenu.module.css'
// import headerCss from './Header.module.css'
import { remote } from 'electron'

const { dialog } = remote

export class ProjectsMenu extends Component {
  openProjectByFilePath = () =>
    dialog.showOpenDialog(
      {
        properties: ['openFile'],
        filters: [{ name: 'AFCA project file', extensions: ['afca'] }],
      },
      filePaths => {
        if (filePaths) {
          this.props.openProjectByFilePath(filePaths[0])
        }
      }
    )

  newProjectFormDialog = () => this.props.newProjectFormDialog()

  render() {
    const { currentProjectId, projects, openProjectById } = this.props
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
                  <MenuItem
                    key={projectMetadata.id}
                    onClick={() => openProjectById(projectMetadata.id)}
                  >
                    {projectMetadata.name}
                  </MenuItem>
                ))}
              </MenuList>
            </Paper>

            <section className={css.buttons}>
              <Button
                className={css.button}
                variant="contained"
                color="primary"
                onClick={this.newProjectFormDialog}
              >
                New project
              </Button>
              <Button
                className={css.button}
                variant="contained"
                color="primary"
                onClick={this.openProjectByFilePath}
              >
                Open existing project
              </Button>
            </section>
          </section>
        </section>
      </section>
    )
  }
}

const mapStateToProps = state => ({
  projects: r.getProjects(state),
  currentProjectId: r.getCurrentProjectId(state),
})

const mapDispatchToProps = {
  openProjectByFilePath: r.openProjectByFilePath,
  openProjectById: r.openProjectById,
  newProjectFormDialog: r.newProjectFormDialog,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectsMenu)
