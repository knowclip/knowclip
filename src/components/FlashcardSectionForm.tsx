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
}: {
  className?: string
  mediaFile: MediaFile
}) => {
  const dispatch = useDispatch()
  const {
    allTags,
    currentFlashcard,
    highlightedClipId,
    selectedClipTime,
    currentNoteType,
    isLoopOn,
    subtitlesFlashcardFieldLinks,
  } = useSelector((state: AppState) => ({
    allTags: r.getAllTags(state),
    currentFlashcard: r.getCurrentFlashcard(state),
    selectedClipTime: r.getSelectedClipTime(state),
    highlightedClipId: r.getHighlightedClipId(state),
    currentNoteType: r.getCurrentNoteType(state),
    isLoopOn: r.isLoopOn(state),
    subtitlesFlashcardFieldLinks: r.getSubtitlesFlashcardFieldLinks(state),
  }))

  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState(null)

  const toggleLoop = useCallback(() => dispatch(actions.toggleLoop()), [
    dispatch,
  ])
  const handleCloseMoreMenu = useCallback(
    () => {
      setMoreMenuAnchorEl(null)
    },
    [setMoreMenuAnchorEl]
  )

  const handleClickDeleteButton = useCallback(
    () => {
      if (highlightedClipId)
        dispatch(
          actions.confirmationDialog(
            'Are you sure you want to delete this clip and flashcard?',
            actions.deleteCard(highlightedClipId)
          )
        )
    },
    [dispatch, highlightedClipId]
  )

  const handleFlashcardSubmit = useCallback(e => {
    e.preventDefault()
  }, [])

  const setFlashcardText = useCallback(
    (key, text) => {
      if (highlightedClipId)
        dispatch(actions.setFlashcardField(highlightedClipId, key, text))
    },
    [dispatch, highlightedClipId]
  )
  const deleteCard = () => {
    if (highlightedClipId) {
      dispatch(actions.deleteCard(highlightedClipId))
    }
  }

  if (!highlightedClipId || !selectedClipTime || !currentFlashcard)
    throw new Error('Clip not found')

  const onAddChip = useCallback(
    (text: string) =>
      dispatch(actions.addFlashcardTag(highlightedClipId, text)),
    [dispatch, highlightedClipId]
  )
  const onDeleteChip = useCallback(
    (index, text) =>
      dispatch(actions.deleteFlashcardTag(highlightedClipId, index, text)),
    [dispatch, highlightedClipId]
  )

  return (
    <form
      className={className}
      onSubmit={handleFlashcardSubmit}
      id={$.container}
    >
      <div className={css.formBody}>
        <section className={css.timeStamp}>
          {formatTime(selectedClipTime.start)}
          {' - '}
          {formatTime(selectedClipTime.end)}
          <Tooltip title="Loop audio (Ctrl + L)">
            <IconButton
              onClick={toggleLoop}
              color={isLoopOn ? 'secondary' : 'default'}
            >
              <Loop />
            </IconButton>
          </Tooltip>
        </section>
        {currentNoteType &&
          getNoteTypeFields(currentNoteType).map(fieldName => (
            <Field
              key={`${fieldName}_${currentFlashcard.id}`}
              name={fieldName}
              currentFlashcard={currentFlashcard}
              label={capitalize(fieldName)}
              setFlashcardText={setFlashcardText}
              subtitles={mediaFile.subtitles}
              linkedSubtitlesTrack={
                subtitlesFlashcardFieldLinks[fieldName] || null
              }
              mediaFileId={mediaFile.id}
              inputProps={{ className: $.flashcardFields }}
            />
          ))}
        <TagsInput
          allTags={allTags}
          tags={currentFlashcard.tags}
          onAddChip={onAddChip}
          onDeleteChip={onDeleteChip}
        />

        <section className={css.bottom}>
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
      </div>
    </form>
  )
}

const capitalize = (string: string) =>
  string.substring(0, 1).toUpperCase() + string.slice(1)

export default FlashcardSectionForm

export { $ as flashcardSectionForm$ }
