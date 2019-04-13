import React, { Component } from 'react'
import { connect } from 'react-redux'
import { IconButton, TextField, Tooltip } from '@material-ui/core'
import { Close as CloseIcon } from '@material-ui/icons'
import * as r from '../redux'
import DarkTheme from './DarkTheme'
import css from './Header.module.css'
import cn from 'classnames'

class ProjectMenu extends Component {
  state = { editing: false, text: '' }

  startEditing = e =>
    this.setState(
      {
        text: this.props.projectMetadata.name,
        editing: true,
      },
      () => this.input.focus()
    )

  handleChangeText = e => this.setState({ text: e.target.value })

  submit = () => {
    const text = this.state.text.trim()
    const { projectMetadata } = this.props
    if (text && text !== projectMetadata.name)
      this.props.setProjectName(projectMetadata.id, text)
    this.setState({ editing: false })
  }

  handleSubmit = e => {
    e.preventDefault()
    this.submit()
  }

  handleBlur = e => this.submit()

  inputRef = el => (this.input = el)

  render() {
    const { projectMetadata, closeProject, className } = this.props
    const { editing, text } = this.state

    return (
      <DarkTheme>
        <section className={cn(className, css.projectMenu)}>
          {editing ? (
            <form
              onSubmit={this.handleSubmit}
              style={{ display: 'inline-block' }}
            >
              <TextField
                inputRef={this.inputRef}
                value={text}
                onChange={this.handleChangeText}
                onBlur={this.handleBlur}
              />
            </form>
          ) : (
            <Tooltip title="Double-click to edit">
              <h1 className={css.projectName} onDoubleClick={this.startEditing}>
                {projectMetadata.name}
              </h1>
            </Tooltip>
          )}
          <IconButton onClick={closeProject}>
            <CloseIcon />
          </IconButton>
        </section>
      </DarkTheme>
    )
  }
}

const mapStateToProps = state => ({
  projectMetadata: r.getCurrentProject(state),
})
const mapDispatchToProps = {
  closeProject: r.closeProject,
  setProjectName: r.setProjectName,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProjectMenu)

// <IconButton onClick={onClickPrevious} disabled={!isPrevButtonEnabled}>
//   <FastRewind />
// </IconButton>
// <IconButton onClick={onClickNext} disabled={!isNextButtonEnabled}>
//   <FastForward />
// </IconButton>
