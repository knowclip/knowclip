import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, TextField, Tooltip } from '@material-ui/core'
import { Close as CloseIcon, Save as SaveIcon } from '@material-ui/icons'
import * as r from '../redux'
import * as actions from '../actions'
import DarkTheme from './DarkTheme'
import css from './MainHeader.module.css'
import cn from 'classnames'
import truncate from '../utils/truncate'

enum $ {
  projectTitle = 'project-title',
  projectTitleInput = 'project-title-input',
  saveButton = 'save-button',
  closeButton = 'close-button',
}

const ProjectMenu = ({ className }: { className: string }) => {
  const projectFile = useSelector((state: AppState) =>
    r.getCurrentProject(state)
  )
  if (!projectFile) throw new Error('Could not find project file')

  const dispatch = useDispatch()
  const closeProjectRequest = useCallback(
    () => {
      dispatch(actions.closeProjectRequest())
    },
    [dispatch]
  )
  const saveProjectRequest = useCallback(
    () => {
      dispatch(actions.saveProjectRequest())
    },
    [dispatch]
  )

  const [state, setState] = useState({ editing: false, text: projectFile.name })
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [inputWidth, setInputWidth] = useState(
    () => projectFile.name.length * 16
  )
  const titleRef = useRef<HTMLHeadingElement>(null)

  const startEditing = useCallback(
    () => {
      setState({
        text: projectFile.name,
        editing: true,
      })
    },
    [setState, projectFile]
  )
  useEffect(
    () => {
      inputRef.current && inputRef.current.focus()
    },
    [state.editing]
  )
  useEffect(
    () => {
      titleRef.current &&
        setInputWidth(titleRef.current.getBoundingClientRect().width)
    },
    [state.text]
  )

  const handleChangeText = useCallback(
    e => setState({ editing: true, text: e.target.value }),
    []
  )

  const submit = useCallback(
    () => {
      const text = state.text.trim()
      if (text && text !== projectFile.name)
        dispatch(actions.setProjectName(projectFile.id, text))
      setState(state => ({ ...state, editing: false }))
    },
    [dispatch, setState, state, projectFile]
  )
  const handleSubmit = useCallback(
    e => {
      e.preventDefault()
      submit()
    },
    [submit]
  )

  const handleBlur = useCallback(
    () => {
      submit()
    },
    [submit]
  )

  const { editing, text } = state

  return (
    <DarkTheme>
      <section className={cn(className, css.projectMenu)}>
        <Tooltip title="Close project">
          <IconButton onClick={closeProjectRequest} id={$.closeButton}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Save project">
          <IconButton onClick={saveProjectRequest} id={$.saveButton}>
            <SaveIcon />
          </IconButton>
        </Tooltip>{' '}
        {editing && (
          <form onSubmit={handleSubmit} style={{ width: `${inputWidth}px` }}>
            <TextField
              inputRef={inputRef}
              classes={{ root: css.projectNameInput }}
              value={text}
              onChange={handleChangeText}
              onBlur={handleBlur}
              fullWidth
              inputProps={{ id: $.projectTitleInput }}
            />
          </form>
        )}
        <Tooltip title="Double-click to edit">
          <h1
            className={cn(css.projectName, {
              [css.projectNameHidden]: editing,
            })}
            onDoubleClick={startEditing}
            id={$.projectTitle}
            ref={titleRef}
          >
            {truncate(state.text, 40)}
          </h1>
        </Tooltip>
      </section>
    </DarkTheme>
  )
}

export default ProjectMenu

export { $ as projectMenu$ }
