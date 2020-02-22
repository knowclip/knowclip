import React, { useCallback, useMemo } from 'react'
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
import Preview from './FlashcardSectionPreview'
import { SubtitlesCardBase } from '../selectors'

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
  const { waveformSelection, clipsIds } = useSelector((state: AppState) => ({
    waveformSelection: r.getWaveformSelection(state),
    clipsIds: mediaFile ? r.getClipIdsByMediaFileId(state, mediaFile.id) : [],
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

  return (
    <section className={cn(className, css.container, $.container, css.card)}>
      {highlightedClip ? (
        <div className={css.clipsCount}>
          {clipIndex + 1} / {clipsLength}
        </div>
      ) : null}

      <Tooltip title="Previous (Ctrl + comma)">
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

      {highlightedClip && mediaFile && (
        <FlashcardForm
          className={css.form}
          mediaFile={mediaFile}
          clipId={highlightedClip.id}
        />
      )}

      {(!waveformSelection || waveformSelection.type === 'Preview') && (
        <Placeholder
          clipsIds={clipsIds}
          mediaFile={mediaFile}
          selection={waveformSelection}
        />
      )}

      <Tooltip title="Next (Ctrl + period)">
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

const Placeholder = ({
  clipsIds,
  mediaFile,
  selection,
}: {
  clipsIds: string[]
  mediaFile: MediaFile | null
  selection: {
    type: 'Preview'
    index: number
    item: SubtitlesCardBase
  } | null
}) => {
  const { fieldsToTracks, subtitles, viewMode } = useSelector(
    (state: AppState) => {
      const subtitlesMounted = mediaFile && mediaFile.subtitles.length
      return {
        fieldsToTracks: subtitlesMounted
          ? r.getSubtitlesFlashcardFieldLinks(state)
          : null,
        subtitles: subtitlesMounted ? r.getSubtitlesCardBases(state) : null,
        viewMode: state.settings.viewMode,
      }
    }
  )

  const className = cn(css.intro, {
    [css.horizontalIntro]: viewMode === 'HORIZONTAL',
  })

  return mediaFile &&
    fieldsToTracks &&
    subtitles &&
    selection &&
    selection.item ? (
    <section className={className}>
      <Preview
        cardBases={subtitles}
        chunkIndex={selection.index}
        clipsIds={clipsIds}
        mediaFile={mediaFile}
        fieldsToTracks={fieldsToTracks}
        viewMode={viewMode}
      />
    </section>
  ) : (
    <section className={className}>
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
