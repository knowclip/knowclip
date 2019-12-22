import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IconButton, TextField, Tooltip } from '@material-ui/core'
import { Close as CloseIcon, Save as SaveIcon } from '@material-ui/icons'
import * as r from '../redux'
import DarkTheme from './DarkTheme'
import css from './Header.module.css'
import cn from 'classnames'
import truncate from '../utils/truncate'

class ProjectMenu extends Component {
  state = { editing: false, text: '' }

  startEditing = e =>
    this.setState(
      {
        text: this.props.projectFileRecord.name,
        editing: true,
      },
      () => this.input.focus()
    )

  handleChangeText = e => this.setState({ text: e.target.value })

  submit = () => {
    const text = this.state.text.trim()
    const { projectFileRecord } = this.props
    if (text && text !== projectFileRecord.name)
      this.props.setProjectName(projectFileRecord.id, text)
    this.setState({ editing: false })
  }

  handleSubmit = e => {
    e.preventDefault()
    this.submit()
  }

  handleBlur = e => this.submit()

  inputRef = el => (this.input = el)

  render() {
    const {
      projectFileRecord,
      closeProjectRequest,
      saveProjectRequest,
      className,
    } = this.props
    const { editing, text } = this.state

    return (
      <DarkTheme>
        <section className={cn(className, css.projectMenu)}>
          <Tooltip title="Close project">
            <IconButton onClick={closeProjectRequest}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save project">
            <IconButton onClick={saveProjectRequest}>
              <SaveIcon />
            </IconButton>
          </Tooltip>{' '}
          {editing ? (
            <form onSubmit={this.handleSubmit} style={{ width: '100%' }}>
              <TextField
                inputRef={this.inputRef}
                classes={{ root: css.projectNameInput }}
                value={text}
                onChange={this.handleChangeText}
                onBlur={this.handleBlur}
              />
            </form>
          ) : (
            <Tooltip title="Double-click to edit">
              <h1 className={css.projectName} onDoubleClick={this.startEditing}>
                {truncate(projectFileRecord.name, 40)}
              </h1>
            </Tooltip>
          )}
        </section>
      </DarkTheme>
    )
  }
}

const mapStateToProps = state => ({
  projectFileRecord: r.getCurrentProject(state),
})
const mapDispatchToProps = {
  closeProjectRequest: r.closeProjectRequest,
  setProjectName: r.setProjectName,
  saveProjectRequest: r.saveProjectRequest,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectMenu)
