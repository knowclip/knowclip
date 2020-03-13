import React, { useCallback, useState, useEffect, memo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Tooltip } from '@material-ui/core'
import {
  Delete as DeleteIcon,
  Loop,
  ShortTextTwoTone,
} from '@material-ui/icons'
import cn from 'classnames'
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
  transcriptionField = 'flashcard-form-transcription',
  pronunciationField = 'flashcard-form-pronunciation',
  meaningField = 'flashcard-form-meaning',
  notesField = 'flashcard-form-notes',
}

const fieldContainerLabels = {
  transcription: $.transcriptionField,
  pronunciation: $.pronunciationField,
  meaning: $.meaningField,
  notes: $.notesField,
} as const

const FIELD_INPUT_PROPS = {
  style: { minHeight: '20px' },
}

const FlashcardSectionForm = memo(
  ({
    className,
    mediaFile,
    autofocusFieldName,
    flashcard,
  }: {
    className?: string
    mediaFile: MediaFile
    clipId: ClipId
    flashcard: Flashcard
    autofocusFieldName: FlashcardFieldName
  }) => {
    const {
      allTags,
      currentNoteType,
      isLoopOn,
      subtitlesFlashcardFieldLinks,
      subtitles,
      mediaIsPlaying,
      viewMode,
    } = useSelector((state: AppState) => ({
      allTags: r.getAllTags(state),
      currentNoteType: r.getCurrentNoteType(state),
      isLoopOn: r.isLoopOn(state),
      subtitlesFlashcardFieldLinks: r.getSubtitlesFlashcardFieldLinks(state),
      subtitles: r.getSubtitlesFilesWithTracks(state),
      mediaIsPlaying: r.isMediaPlaying(state),
      viewMode: state.settings.viewMode,
    }))
    const { id } = flashcard

    const dispatch = useDispatch()

    const toggleLoop = useCallback(() => dispatch(actions.toggleLoop()), [
      dispatch,
    ])
    const focusRef = useRef<HTMLInputElement>()

    // focus first field on highlight clip
    // and, while playing, trigger loop during further field/button interactions
    const [initialFocus, setInitialFocusComplete] = useState(false)
    const loopOnInteract = useCallback(
      () => {
        if (mediaIsPlaying && !isLoopOn) dispatch(actions.setLoop(true))
      },
      [dispatch, isLoopOn, mediaIsPlaying]
    )

    useEffect(
      () => {
        setInitialFocusComplete(false)
      },
      [id]
    )
    useEffect(
      () => {
        if (!initialFocus) {
          focusRef.current && focusRef.current.focus()
          if (mediaIsPlaying) setInitialFocusComplete(true)
        }
      },
      [mediaIsPlaying, initialFocus, focusRef.current] // eslint-disable-line react-hooks/exhaustive-deps
    )
    const handleFocus = useCallback(
      () => {
        if (!initialFocus) setInitialFocusComplete(true)
        else loopOnInteract()
      },
      [initialFocus, loopOnInteract]
    )

    const handleClickDeleteButton = useCallback(
      () => {
        dispatch(
          actions.confirmationDialog(
            'Are you sure you want to delete this clip and flashcard?',
            actions.deleteCard(id)
          )
        )
        loopOnInteract()
      },
      [dispatch, id, loopOnInteract]
    )
    const handleClickPreviewButton = useCallback(
      () => {
        dispatch(actions.stopEditingCards())
      },
      [dispatch]
    )

    const handleFlashcardSubmit = useCallback(e => {
      e.preventDefault()
    }, [])

    const setFlashcardText = useCallback(
      (key, text, caretLocation) =>
        dispatch(actions.setFlashcardField(id, key, text, caretLocation)),
      [dispatch, id]
    )

    const onAddChip = useCallback(
      (text: string) => dispatch(actions.addFlashcardTag(id, text)),
      [dispatch, id]
    )
    const onDeleteChip = useCallback(
      (index, text) => dispatch(actions.deleteFlashcardTag(id, index, text)),
      [dispatch, id]
    )

    const fieldProps = {
      currentFlashcard: flashcard,
      setFlashcardText: setFlashcardText,
      mediaFileId: mediaFile.id,
      inputProps: FIELD_INPUT_PROPS,
      onKeyPress: loopOnInteract,
    }

    return (
      <form
        className={cn(className, {
          [css.horizontalForm]: viewMode === 'HORIZONTAL',
        })}
        onSubmit={handleFlashcardSubmit}
        id={$.container}
      >
        <section
          className={cn(css.formTop, {
            [css.horizontalFormTop]: viewMode === 'HORIZONTAL',
          })}
        >
          {mediaFile.isVideo && (
            <VideoStillDisplay
              flashcard={flashcard}
              videoFile={mediaFile}
              onFocus={handleFocus}
              height={viewMode === 'HORIZONTAL' ? 120 : 85}
            />
          )}
        </section>
        <section className={css.formBody}>
          {currentNoteType &&
            getNoteTypeFields(currentNoteType).map((fieldName, i) => {
              const linkedTrackId =
                subtitlesFlashcardFieldLinks[fieldName] || null
              return (
                <Field
                  key={`${fieldName}_${flashcard.id}`}
                  inputRef={
                    fieldName === autofocusFieldName ? focusRef : undefined
                  }
                  name={fieldName}
                  subtitles={subtitles}
                  linkedSubtitlesTrack={linkedTrackId}
                  onFocus={!initialFocus && i === 0 ? () => {} : handleFocus}
                  className={fieldContainerLabels[fieldName]}
                  {...fieldProps}
                />
              )
            })}
          <TagsInput
            allTags={allTags}
            tags={flashcard.tags}
            onAddChip={onAddChip}
            onDeleteChip={onDeleteChip}
            onFocus={handleFocus}
          />
        </section>

        <section className={css.menu}>
          <Tooltip title="Show card preview + cloze deletions (Esc)">
            <IconButton onClick={handleClickPreviewButton}>
              <ShortTextTwoTone />
            </IconButton>
          </Tooltip>
        </section>

        <section className={css.secondaryMenu}>
          <Tooltip title="Loop selection (Ctrl + L)">
            <IconButton
              onClick={toggleLoop}
              color={isLoopOn ? 'secondary' : 'default'}
            >
              <Loop />
            </IconButton>
          </Tooltip>{' '}
          <Tooltip title="Delete clip and card">
            <IconButton onClick={handleClickDeleteButton} id={$.deleteButton}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </section>
      </form>
    )
  }
)

export const capitalize = (string: string) =>
  string.substring(0, 1).toUpperCase() + string.slice(1)

export default FlashcardSectionForm

export { $ as flashcardSectionForm$ }
