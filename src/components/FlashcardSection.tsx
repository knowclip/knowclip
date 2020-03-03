import React, { useCallback, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { IconButton, Tooltip } from '@material-ui/core'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSection.module.css'
import {
  ChevronLeft,
  ChevronRight,
  Subtitles,
  Hearing,
  Layers,
} from '@material-ui/icons'
import * as actions from '../actions'
import FlashcardForm from './FlashcardSectionForm'
import FlashcardDisplay from './FlashcardSectionDisplayCard'
import Preview from './FlashcardSectionDisplayPreview'

enum $ {
  container = 'flashcard-section-container',
  previousClipButton = 'previous-clip-button',
  nextClipButton = 'next-clip-button',
}

const FlashcardSection = ({
  mediaFile,
  className,
}: {
  mediaFile: MediaFile | null
  className?: string
}) => {
  const {
    waveformSelection,
    clipsIds,
    editing,
    fieldsToTracks,
    subtitles,
    viewMode,
  } = useSelector((state: AppState) => ({
    waveformSelection: r.getWaveformSelection(state),
    clipsIds: mediaFile ? r.getClipIdsByMediaFileId(state, mediaFile.id) : [],
    editing: state.session.editingCards,
    fieldsToTracks: r.getSubtitlesFlashcardFieldLinks(state),
    subtitles: r.getSubtitlesCardBases(state),
    viewMode: state.settings.viewMode,
  }))

  const highlightedClip =
    waveformSelection && waveformSelection.type === 'Clip'
      ? waveformSelection.item
      : null

  const clipsLength = clipsIds.length
  const clipIndex = useMemo(
    () => (highlightedClip ? clipsIds.indexOf(highlightedClip.id) : -1),
    [clipsIds, highlightedClip]
  )
  const dispatch = useDispatch()

  const [autofocusFieldName, setAutofocusFieldName] = useState<
    TransliterationFlashcardFieldName
  >('transcription')

  // const handleDoubleClickCardDisplayField = useCallback(
  //   fieldName => {
  //     setAutofocusFieldName(fieldName)
  //     dispatch(actions.startEditingCards())
  //   },
  //   [setAutofocusFieldName, dispatch]
  // )

  return (
    <section className={cn(className, css.container, $.container, css.card)}>
      {highlightedClip ? (
        <div className={css.clipsCount}>
          {clipIndex + 1} / {clipsLength}
        </div>
      ) : null}

      <Tooltip title="Previous (← key)">
        <IconButton
          className={cn(css.prevButton, $.previousClipButton)}
          disabled={clipsLength < 2}
          onClick={useCallback(
            () => dispatch(actions.highlightLeftClipRequest()),
            [dispatch]
          )}
        >
          <ChevronLeft />
        </IconButton>
      </Tooltip>

      {highlightedClip && mediaFile && editing && (
        <FlashcardForm
          key={highlightedClip.id}
          className={css.form}
          mediaFile={mediaFile}
          clipId={highlightedClip.id}
          autofocusFieldName={autofocusFieldName}
        />
      )}
      {highlightedClip && mediaFile && !editing && (
        <section className={css.display}>
          <FlashcardDisplay mediaFile={mediaFile} clipId={highlightedClip.id} />
        </section>
      )}
      {mediaFile && waveformSelection && waveformSelection.type === 'Preview' && (
        <section
          className={cn(css.preview, css.display, {
            [css.horizontalIntro]: viewMode === 'HORIZONTAL',
          })}
        >
          <Preview
            key={waveformSelection.cardBaseIndex}
            cardBases={subtitles}
            cardPreviewSelection={waveformSelection}
            clipsIds={clipsIds}
            mediaFile={mediaFile}
            fieldsToTracks={fieldsToTracks}
            viewMode={viewMode}
          />
        </section>
      )}
      {!waveformSelection && <Placeholder viewMode={viewMode} />}
      <Tooltip title="Next (→ key)">
        <IconButton
          className={cn(css.nextButton, $.nextClipButton)}
          disabled={clipsLength < 2}
          onClick={useCallback(
            () => dispatch(actions.highlightRightClipRequest()),
            [dispatch]
          )}
        >
          <ChevronRight />
        </IconButton>
      </Tooltip>
    </section>
  )
}

const Placeholder = ({ viewMode }: { viewMode: ViewMode }) => {
  return (
    <section
      className={cn(css.intro, css.display, {
        [css.horizontalIntro]: viewMode === 'HORIZONTAL',
      })}
    >
      <p className={css.introText}>
        You can <strong>create clips</strong> in a few different ways:
      </p>
      <ul className={css.introList}>
        <li>
          Manually <strong>click and drag</strong> on the waveform
        </li>

        <li>
          Use <Hearing className={css.icon} />{' '}
          <strong>silence detection</strong> to automatically make clips from
          audio containing little background noise.
        </li>
        <li>
          Use <Subtitles className={css.icon} /> <strong>subtitles</strong> to
          automatically create both clips and flashcards.
        </li>
      </ul>
      <p className={css.introText}>
        When you're done, press the <Layers className={css.icon} />{' '}
        <strong>export button</strong>.
      </p>
    </section>
  )
}

export default FlashcardSection

export { $ as flashcardSection$ }
