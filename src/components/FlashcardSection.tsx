import React, { MouseEventHandler, useCallback, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Tooltip } from '@mui/material'
import cn from 'classnames'
import r from '../redux'
import css from './FlashcardSection.module.css'
import {
  ChevronLeft,
  ChevronRight,
  Subtitles,
  Publish,
  ShortTextTwoTone,
} from '@mui/icons-material'
import { actions } from '../actions'
import FlashcardForm from './FlashcardSectionForm'
import FlashcardDisplay from './FlashcardSectionDisplayCard'
import Preview from './FlashcardSectionDisplayPreview'
import { showOpenDialog } from '../utils/electron'
import { getFileFilters } from '../utils/files'
import { getKeyboardShortcut } from './KeyboardShortcuts'

import { flashcardSection$ as $ } from './FlashcardSection.testLabels'

const FlashcardSection = ({
  mediaFile,
  className,
  projectFile,
  selectPrevious,
  selectNext,
  mediaIsPlaying,
}: {
  mediaFile: MediaFile | null
  className?: string
  projectFile: ProjectFile
  selectPrevious: () => void
  selectNext: () => void
  mediaIsPlaying: boolean
}) => {
  const {
    waveformSelection,
    clipsIds,
    editing,
    flashcard,
    fieldsToTracks,
    subtitles,
    viewMode,
  } = useSelector((state: AppState) => {
    const mediaIsEffectivelyLoading = r.isMediaEffectivelyLoading(state)
    return {
      waveformSelection: r.getSelectionItem(state),
      clipsIds: mediaFile ? r.getClipIdsByMediaFileId(state, mediaFile.id) : [],
      editing: state.session.editingCards,
      flashcard: r.getHighlightedFlashcard(state),
      fieldsToTracks: r.getSubtitlesFlashcardFieldLinks(state),
      subtitles: mediaIsEffectivelyLoading
        ? null
        : r.getSubtitlesCardBases(state),
      viewMode: state.settings.viewMode,
    }
  })

  const highlightedClip =
    waveformSelection?.clipwaveType === 'Primary' ? waveformSelection : null

  const clipsLength = clipsIds.length
  const clipIndex = useMemo(
    () => (highlightedClip ? clipsIds.indexOf(highlightedClip.id) : -1),
    [clipsIds, highlightedClip]
  )
  // TODO: restore autofocus
  const [autofocusFieldName, _setAutofocusFieldName] =
    useState<TransliterationFlashcardFieldName>('transcription')

  // const handleDoubleClickCardDisplayField = useCallback(
  //   fieldName => {
  //     setAutofocusFieldName(fieldName)
  //     dispatch(actions.startEditingCards())
  //   },
  //   [setAutofocusFieldName, dispatch]
  // )

  return (
    <section
      className={cn(className, css.container, $.container, css.card, {
        [css.horizontalCard]: viewMode === 'HORIZONTAL',
      })}
    >
      {highlightedClip ? (
        <div className={css.clipsCount}>
          {clipIndex + 1} / {clipsLength}
        </div>
      ) : null}

      <Tooltip
        title={
          editing
            ? `Previous (${getKeyboardShortcut(
                'Select previous (while editing)'
              )} key)`
            : `Previous (${getKeyboardShortcut('Select previous')})`
        }
      >
        <IconButton
          className={cn(css.prevButton, $.previousClipButton)}
          onClick={useCallback(() => selectPrevious(), [selectPrevious])}
        >
          <ChevronLeft />
        </IconButton>
      </Tooltip>

      {highlightedClip && mediaFile && editing && flashcard && (
        <FlashcardForm
          key={highlightedClip.id}
          className={cn(css.form, css.flashcardSectionContents)}
          mediaFile={mediaFile}
          flashcard={flashcard}
          clipId={highlightedClip.id}
          mediaIsPlaying={mediaIsPlaying}
          autofocusFieldName={autofocusFieldName}
        />
      )}
      {highlightedClip && mediaFile && flashcard && !editing && (
        <FlashcardDisplay
          mediaFile={mediaFile}
          flashcard={flashcard}
          clipId={highlightedClip.id}
          className={css.flashcardSectionContents}
        />
      )}
      {mediaFile &&
        subtitles &&
        waveformSelection &&
        waveformSelection.clipwaveType === 'Secondary' && (
          <Preview
            key={waveformSelection.id}
            cardBases={subtitles}
            cardBase={waveformSelection}
            clipsIds={clipsIds}
            mediaFile={mediaFile}
            fieldsToTracks={fieldsToTracks}
            viewMode={viewMode}
            className={css.flashcardSectionContents}
          />
        )}
      {!waveformSelection && (
        <Placeholder
          viewMode={viewMode}
          mediaFile={mediaFile}
          currentProjectId={projectFile.id}
        />
      )}
      <Tooltip
        title={
          editing
            ? `Next (${getKeyboardShortcut('Select next (while editing)')} key)`
            : `Next (${getKeyboardShortcut('Select next')})`
        }
      >
        <IconButton
          className={cn(css.nextButton, $.nextClipButton)}
          onClick={useCallback(() => selectNext(), [selectNext])}
        >
          <ChevronRight />
        </IconButton>
      </Tooltip>
    </section>
  )
}

const Placeholder = ({
  viewMode,
  mediaFile,
  currentProjectId,
}: {
  viewMode: ViewMode
  mediaFile: MediaFile | null
  currentProjectId: string
}) => {
  const dispatch = useDispatch()
  const addMediaRequest: MouseEventHandler = useCallback(
    async (e) => {
      e.preventDefault()
      const filePaths = await showOpenDialog(getFileFilters('MediaFile'), true)

      if (filePaths) {
        dispatch(actions.addMediaToProjectRequest(currentProjectId, filePaths))
      }
    },
    [currentProjectId, dispatch]
  )
  return (
    <section
      className={cn(css.intro, {
        [css.horizontalIntro]: viewMode === 'HORIZONTAL',
      })}
    >
      {!mediaFile && (
        <p className={css.introText}>
          Start by{' '}
          <strong>
            <a href="/#" onClick={addMediaRequest}>
              adding a media file
            </a>
          </strong>
          !
        </p>
      )}
      <p className={css.introText}>
        To make a new clip, <strong>click and drag</strong> on the waveform
        below.
      </p>
      <p className={css.introText}>
        After you've filled in your flashcard fields, you can see a{' '}
        <ShortTextTwoTone className={css.icon} /> <strong>preview</strong> of
        your card. From there you can the transcription field to make{' '}
        <strong>cloze deletion</strong> cards (a.k.a fill-in-the-blank cards).
      </p>
      <p className={css.introText}>
        You can add <Subtitles className={css.icon} />{' '}
        <strong>subtitles</strong> files to make clips and cards automatically.{' '}
        <strong>Double-click</strong> on a subtitles chunk to make a new clip
        from it.
      </p>
      <p className={css.introText}>
        When you're done, press the <Publish className={css.icon} />{' '}
        <strong>export button</strong>.
      </p>
    </section>
  )
}

export default FlashcardSection
