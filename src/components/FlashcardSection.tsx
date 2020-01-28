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
  const { highlightedClip, clipsIds } = useSelector((state: AppState) => ({
    highlightedClip: r.getHighlightedClip(state),
    clipsIds: mediaFile ? r.getClipIdsByMediaFileId(state, mediaFile.id) : [],
  }))

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

      <Tooltip title="Previous clip (Ctrl + comma)">
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

      {highlightedClip && mediaFile ? (
        <FlashcardForm
          className={css.form}
          mediaFile={mediaFile}
          clipId={highlightedClip.id}
        />
      ) : (
        <Placeholder />
      )}

      <Tooltip title="Next clip (Ctrl + period)">
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

const Placeholder = () => (
  <section className={css.intro}>
    <p className={css.introText}>
      You can <strong>create clips</strong> in a few different ways:
    </p>
    <ul className={css.introList}>
      <li>
        Manually <strong>click and drag</strong> on the waveform
      </li>

      <li>
        Use <Hearing className={css.icon} /> <strong>silence detection</strong>{' '}
        to automatically make clips from audio containing little background
        noise.
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

export default FlashcardSection

export { $ as flashcardSection$ }
