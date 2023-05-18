import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, TextField, Tooltip } from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Publish,
} from '@mui/icons-material'
import r from '../redux'
import { actions } from '../actions'
import DarkTheme from './DarkTheme'
import css from './MainHeader.module.css'
import cn from 'classnames'
import truncate from '../utils/truncate'
import { useNavigate } from 'react-router'

enum $ {
  projectTitle = 'project-title',
  projectTitleInput = 'project-title-input',
  saveButton = 'save-button',
  closeButton = 'close-button',
  exportButton = 'export-button',
}

const ProjectMenu = ({ className }: { className: string }) => {
  const navigate = useNavigate()
  const projectFile = useSelector((state: AppState) =>
    r.getCurrentProject(state)
  )
  const initialProjectName = projectFile?.name || ''

  const { currentMediaFile, mediaFileIds, currentFileClipsIds, workIsUnsaved } =
    useSelector((state: AppState) => {
      const currentMediaFile = r.getCurrentMediaFile(state)
      const currentProject = r.getCurrentProject(state)
      return {
        loop: r.getLoopState(state),
        audioIsLoading: r.isMediaEffectivelyLoading(state),
        currentProjectId: r.getCurrentProjectId(state),
        constantBitrateFilePath:
          r.getCurrentMediaConstantBitrateFilePath(state),
        currentMediaFile,
        mediaFileIds: currentProject ? currentProject.mediaFileIds : EMPTY,
        currentFileClipsIds: currentMediaFile
          ? state.clips.idsByMediaFileId[currentMediaFile.id]
          : EMPTY,
        subtitles: r.getSubtitlesTracks(state),
        viewMode: state.settings.viewMode,
        workIsUnsaved: r.isWorkUnsaved(state),
      }
    })

  const clipsIdsForExport = useMemo(() => {
    const result: ReviewAndExportDialogData['mediaFileIdsToClipIds'] = {}
    for (const mediaFileId of mediaFileIds) result[mediaFileId] = []
    if (currentMediaFile) result[currentMediaFile.id] = [...currentFileClipsIds]

    return result
  }, [mediaFileIds, currentMediaFile, currentFileClipsIds])

  const dispatch = useDispatch()
  const closeProjectRequest = useCallback(() => {
    if (projectFile) dispatch(actions.closeProjectRequest())
    else navigate('/')
  }, [dispatch, projectFile, navigate])
  const saveProjectRequest = useCallback(() => {
    if (!projectFile) return
    dispatch(actions.saveProjectRequest())
  }, [dispatch, projectFile])

  const [state, setState] = useState({
    editing: false,
    text: initialProjectName,
  })
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [inputWidth, setInputWidth] = useState(
    () => initialProjectName.length * 16
  )
  const titleRef = useRef<HTMLHeadingElement>(null)

  const startEditing = useCallback(() => {
    setState({
      text: initialProjectName,
      editing: true,
    })
  }, [setState, initialProjectName])
  useEffect(() => {
    if (state.editing && inputRef.current) inputRef.current.focus()
  }, [state.editing])
  useEffect(() => {
    titleRef.current &&
      setInputWidth(titleRef.current.getBoundingClientRect().width)
  }, [state.text])

  const handleChangeText = useCallback(
    (e) => setState({ editing: true, text: e.target.value }),
    []
  )
  useEffect(() => {
    if (projectFile && projectFile.name !== initialProjectName)
      setState((state) => ({ ...state, text: projectFile.name }))
  }, [projectFile, initialProjectName])

  const submit = useCallback(() => {
    if (!projectFile) return
    const text = state.text.trim()
    if (text && text !== projectFile.name)
      dispatch(actions.setProjectName(projectFile.id, text))
    setState((state) => ({ ...state, editing: false }))
  }, [dispatch, setState, state, projectFile])
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      submit()
    },
    [submit]
  )

  const handleFocus = useCallback(() => {
    setState((state) => ({ ...state, editing: true }))
  }, [setState])

  const handleBlur = useCallback(() => {
    submit()
  }, [submit])

  const reviewAndExportDialog = useCallback(() => {
    if (!currentMediaFile) return
    dispatch(actions.reviewAndExportDialog(currentMediaFile, clipsIdsForExport))
  }, [dispatch, currentMediaFile, clipsIdsForExport])

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
          <IconButton
            disabled={!projectFile}
            onClick={saveProjectRequest}
            id={$.saveButton}
            color={workIsUnsaved ? 'secondary' : 'default'}
          >
            <SaveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Review and export flashcards">
          <IconButton
            id={$.exportButton}
            className={css.floatingActionButton}
            onClick={reviewAndExportDialog}
            disabled={!projectFile}
          >
            <Publish />
          </IconButton>
        </Tooltip>
        {
          <form
            onSubmit={handleSubmit}
            style={{ width: `${inputWidth}px` }}
            className={cn(css.projectNameForm, {
              [css.projectNameFormHidden]: !editing,
            })}
          >
            <TextField
              inputRef={inputRef}
              classes={{ root: css.projectNameInput }}
              value={text}
              onChange={handleChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              fullWidth
              inputProps={{ id: $.projectTitleInput }}
            />
          </form>
        }

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

const EMPTY: string[] = []
