import React, { useCallback, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core'
import { Delete as DeleteIcon, Loop } from '@material-ui/icons'
import formatTime from '../utils/formatTime'
import * as r from '../redux'
import css from './FlashcardSection.module.css'
import { getNoteTypeFields } from '../utils/noteType'
import TagsInput from './TagsInput'
import * as actions from '../actions'
import Field from './FlashcardSectionFormField'

enum $ {
  container = 'flashcard-form-container',
  flashcardFields = 'flashcard-field',
  deleteButton = 'delete-clip-button',
}

const FlashcardSectionForm = ({
  className,
  mediaFile,
  clipId,
}: {
  className?: string
  mediaFile: MediaFile
  clipId: string
}) => {
  const {
    allTags,
    currentFlashcard,
    selectedClipTime,
    currentNoteType,
    isLoopOn,
    subtitlesFlashcardFieldLinks,
  } = useSelector((state: AppState) => ({
    allTags: r.getAllTags(state),
    currentFlashcard: r.getCurrentFlashcard(state),
    selectedClipTime: r.getSelectedClipTime(state),
    currentNoteType: r.getCurrentNoteType(state),
    isLoopOn: r.isLoopOn(state),
    subtitlesFlashcardFieldLinks: r.getSubtitlesFlashcardFieldLinks(state),
  }))

  if (!selectedClipTime || !currentFlashcard) throw new Error('Clip not found')

  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState(null)

  const dispatch = useDispatch()

  const toggleLoop = useCallback(() => dispatch(actions.toggleLoop()), [
    dispatch,
  ])
  const loopOnInteract = useCallback(
    () => {
      const media = document.getElementById('mediaPlayer')
      const mediaIsPlaying =
        media && !(media as HTMLVideoElement | HTMLAudioElement).paused
      if (mediaIsPlaying && !isLoopOn) dispatch(actions.setLoop(true))
    },
    [dispatch, isLoopOn]
  )
  const [focusedOnLoad, setFocusedOnLoad] = useState(false)
  const handleFocus = useCallback(
    () => {
      if (!focusedOnLoad) return setFocusedOnLoad(true)

      loopOnInteract()
    },
    [focusedOnLoad, setFocusedOnLoad, loopOnInteract]
  )

  const handleCloseMoreMenu = useCallback(
    () => {
      setMoreMenuAnchorEl(null)
    },
    [setMoreMenuAnchorEl]
  )
  const handleClickDeleteButton = useCallback(
    () => {
      dispatch(
        actions.confirmationDialog(
          'Are you sure you want to delete this clip and flashcard?',
          actions.deleteCard(clipId)
        )
      )
      loopOnInteract()
    },
    [dispatch, clipId, loopOnInteract]
  )

  const handleFlashcardSubmit = useCallback(e => {
    e.preventDefault()
  }, [])

  const setFlashcardText = useCallback(
    (key, text) => dispatch(actions.setFlashcardField(clipId, key, text)),
    [dispatch, clipId]
  )
  const deleteCard = useCallback(
    () => {
      dispatch(actions.deleteCard(clipId))
    },
    [dispatch, clipId]
  )

  const onAddChip = useCallback(
    (text: string) => dispatch(actions.addFlashcardTag(clipId, text)),
    [dispatch, clipId]
  )
  const onDeleteChip = useCallback(
    (index, text) => dispatch(actions.deleteFlashcardTag(clipId, index, text)),
    [dispatch, clipId]
  )

  return (
    <form
      className={className}
      onSubmit={handleFlashcardSubmit}
      id={$.container}
      onFocus={handleFocus}
    >
      <section className={css.formTop}>
        <span className={css.timeStamp}>
          {formatTime(selectedClipTime.start)}
          {' - '}
          {formatTime(selectedClipTime.end)}
        </span>
        <Tooltip title="Loop audio (Ctrl + L)">
          <IconButton
            onClick={toggleLoop}
            color={isLoopOn ? 'secondary' : 'default'}
          >
            <Loop />
          </IconButton>
        </Tooltip>
      </section>
      <section className={css.formBody}>
        {currentNoteType &&
          getNoteTypeFields(currentNoteType).map((fieldName, i) => (
            <Field
              key={`${fieldName}_${currentFlashcard.id}`}
              autoFocus={i === 0}
              name={fieldName}
              currentFlashcard={currentFlashcard}
              label={capitalize(fieldName)}
              setFlashcardText={setFlashcardText}
              subtitles={mediaFile.subtitles}
              linkedSubtitlesTrack={
                subtitlesFlashcardFieldLinks[fieldName] || null
              }
              mediaFileId={mediaFile.id}
              inputProps={{
                className: $.flashcardFields,
                style: { minHeight: '20px' },
              }}
              onKeyDown={loopOnInteract}
            />
          ))}
        <TagsInput
          allTags={allTags}
          tags={currentFlashcard.tags}
          onAddChip={onAddChip}
          onDeleteChip={onDeleteChip}
        />
      </section>

      <section className={css.formBottom}>
        <IconButton onClick={handleClickDeleteButton} id={$.deleteButton}>
          <DeleteIcon />
        </IconButton>
        <Menu
          anchorEl={moreMenuAnchorEl}
          open={Boolean(moreMenuAnchorEl)}
          onClose={handleCloseMoreMenu}
        >
          <MenuItem onClick={deleteCard}>Delete card</MenuItem>
        </Menu>
      </section>
    </form>
  )
}

const capitalize = (string: string) =>
  string.substring(0, 1).toUpperCase() + string.slice(1)

export default FlashcardSectionForm

export { $ as flashcardSectionForm$ }
