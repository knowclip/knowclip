import React, { useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Tooltip, CardMedia, CircularProgress } from '@mui/material'
import cn from 'clsx'
import r from '../redux'
import css from './FlashcardSection.module.css'

const VideoStillDisplay = ({
  videoFile,
  flashcard,
  onFocus,
  height = 85,
  preloadAdjacent = true,
}: {
  videoFile: VideoFile
  flashcard: Flashcard
  onFocus: (event: any) => void
  height?: number
  preloadAdjacent?: boolean
}) => {
  const { videoStill, stillUrl, mediaFileAvailability } = useSelector(
    (state: AppState) => {
      const videoStill = r.getFileWithAvailability<VideoStillImageFile>(
        state,
        'VideoStillImage',
        flashcard.id
      )
      return {
        videoStill,
        stillUrl: videoStill.file
          ? r.getFileUrl(state, videoStill.file.id)
          : null,
        mediaFileAvailability: r.getFileAvailability(state, videoFile),
      }
    }
  )

  const dispatch = useDispatch()

  useEffect(() => {
    if (preloadAdjacent) dispatch(r.preloadVideoStills(videoFile, flashcard.id))
  }, [flashcard.id, dispatch, videoFile, preloadAdjacent])

  const handleClick = useCallback(() => {
    dispatch(
      flashcard.image
        ? r.removeFlashcardImage(flashcard.id)
        : r.addFlashcardImage(flashcard.id)
    )
  }, [flashcard.image, flashcard.id, dispatch])

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
          width:
            Math.round((videoFile.width / videoFile.height) * height) + 'px',
          height: height + 'px',
        }}
        onFocus={onFocus}
      >
        <CardMedia
          className={cn(css.flashcardImage)}
          image={stillUrl || undefined}
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
