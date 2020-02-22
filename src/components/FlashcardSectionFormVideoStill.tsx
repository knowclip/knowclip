import React, { useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Tooltip, CardMedia, CircularProgress } from '@material-ui/core'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSection.module.css'

const VideoStillDisplay = ({
  videoFile,
  flashcard,
  onFocus,
}: {
  videoFile: VideoFile
  flashcard: Flashcard
  onFocus: (event: any) => void
}) => {
  const { videoStill, mediaFileAvailability } = useSelector(
    (state: AppState) => ({
      videoStill: r.getFileWithAvailability<VideoStillImageFile>(
        state,
        'VideoStillImage',
        flashcard.id
      ),
      mediaFileAvailability: r.getFileAvailability(state, videoFile),
    })
  )

  const dispatch = useDispatch()

  useEffect(
    () => {
      dispatch(r.preloadVideoStills(videoFile, flashcard.id))
    },
    [flashcard.id, dispatch, videoFile]
  )
  const { filePath } = videoStill.availability

  const handleClick = useCallback(
    () => {
      dispatch(
        flashcard.image
          ? r.removeFlashcardImage(flashcard.id)
          : r.addFlashcardImage(flashcard.id)
      )
    },
    [flashcard.image, flashcard.id, dispatch]
  )

  const title = flashcard.image
    ? 'Click to leave out image'
    : 'Click to include image'

  return (
    <Tooltip tabIndex={0} title={title}>
      <button
        className={cn(css.flashcardImageContainer, {
          [css.flashcardImageUnused]: !flashcard.image,
        })}
        onClick={handleClick}
        name={title}
        style={{
          width: Math.round((videoFile.width / videoFile.height) * 85) + 'px',
          height: 85 + 'px',
        }}
        onFocus={onFocus}
      >
        <CardMedia
          className={cn(css.flashcardImage)}
          image={filePath ? `file://${filePath}` : undefined}
        >
          {videoStill.availability.status !== 'CURRENTLY_LOADED' &&
          mediaFileAvailability.status === 'CURRENTLY_LOADED' ? (
            <CircularProgress />
          ) : null}
        </CardMedia>
      </button>
    </Tooltip>
  )
}

export default VideoStillDisplay
