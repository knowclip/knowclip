import React, { useCallback, useState, useEffect, memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core'
import { Delete as DeleteIcon, Loop } from '@material-ui/icons'
import formatTime from '../utils/formatTime'
import * as r from '../redux'
import css from './FlashcardSection.module.css'
import { getNoteTypeFields } from '../utils/noteType'
import TagsInput from './TagsInput'
import VideoStillDisplay from './FlashcardSectionFormVideoStill'
import * as actions from '../actions'
import Field from './FlashcardSectionFormField'

enum $ {
  container = 'flashcard-form-container',
  flashcardFields = 'flashcard-field',
  deleteButton = 'delete-clip-button',
}

const FIELD_INPUT_PROPS = {
  style: { minHeight: '20px' },
}

const FlashcardSectionForm = memo(
  ({
    className,
    mediaFile,
  }: {
    className?: string
    mediaFile: MediaFile
    clipId: ClipId
  }) => {
    const {
      allTags,
      selectedClipTime,
      currentNoteType,
      isLoopOn,
      subtitlesFlashcardFieldLinks,
      clip,
    } = useSelector((state: AppState) => ({
      allTags: r.getAllTags(state),
      selectedClipTime: r.getSelectedClipTime(state),
      currentNoteType: r.getCurrentNoteType(state),
      isLoopOn: r.isLoopOn(state),
      subtitlesFlashcardFieldLinks: r.getSubtitlesFlashcardFieldLinks(state),
      clip: r.getHighlightedClip(state),
    }))

    if (!selectedClipTime || !clip) throw new Error('Clip not found')

    const { flashcard } = clip

    const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState(null)

    const dispatch = useDispatch()

    const toggleLoop = useCallback(() => dispatch(actions.toggleLoop()), [
      dispatch,
    ])

    const [focusedOnLoad, setFocusedOnLoad] = useState(false)
    const loopOnInteract = useCallback(
      () => {
        const media = document.getElementById('mediaPlayer')
        const mediaIsPlaying =
          media && !(media as HTMLVideoElement | HTMLAudioElement).paused
        if (mediaIsPlaying && !isLoopOn) dispatch(actions.setLoop(true))
      },
      [dispatch, isLoopOn]
    )

    useEffect(
      () => {
        setFocusedOnLoad(false)
      },
      [clip.id]
    )
    const handleFocus = useCallback(
      () => {
        if (!focusedOnLoad) setFocusedOnLoad(true)
        else loopOnInteract()
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
            actions.deleteCard(clip.id)
          )
        )
        loopOnInteract()
      },
      [dispatch, clip.id, loopOnInteract]
    )

    const handleFlashcardSubmit = useCallback(e => {
      e.preventDefault()
    }, [])

    const setFlashcardText = useCallback(
      (key, text) => dispatch(actions.setFlashcardField(clip.id, key, text)),
      [dispatch, clip.id]
    )
    const deleteCard = useCallback(
      () => {
        dispatch(actions.deleteCard(clip.id))
      },
      [dispatch, clip.id]
    )

    const onAddChip = useCallback(
      (text: string) => dispatch(actions.addFlashcardTag(clip.id, text)),
      [dispatch, clip.id]
    )
    const onDeleteChip = useCallback(
      (index, text) =>
        dispatch(actions.deleteFlashcardTag(clip.id, index, text)),
      [dispatch, clip.id]
    )

    return (
      <form
        className={className}
        onSubmit={handleFlashcardSubmit}
        id={$.container}
        onFocus={handleFocus}
      >
        <section className={css.formTop}>
          <div className={css.formTopLeft}>
            {mediaFile.isVideo && (
              <VideoStillDisplay clip={clip} videoFile={mediaFile} />
            )}
          </div>

          <div className={css.formTopRight}>
            {' '}
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
          </div>
        </section>
        <section className={css.formBody}>
          {currentNoteType &&
            getNoteTypeFields(currentNoteType).map((fieldName, i) => (
              <Field
                key={`${fieldName}_${flashcard.id}`}
                autoFocus={i === 0}
                name={fieldName}
                currentFlashcard={flashcard}
                label={capitalize(fieldName)}
                setFlashcardText={setFlashcardText}
                subtitles={mediaFile.subtitles}
                linkedSubtitlesTrack={
                  subtitlesFlashcardFieldLinks[fieldName] || null
                }
                mediaFileId={mediaFile.id}
                inputProps={FIELD_INPUT_PROPS}
                onKeyPress={loopOnInteract}
              />
            ))}
          <TagsInput
            allTags={allTags}
            tags={flashcard.tags}
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
)

const capitalize = (string: string) =>
  string.substring(0, 1).toUpperCase() + string.slice(1)

export default FlashcardSectionForm

export { $ as flashcardSectionForm$ }
