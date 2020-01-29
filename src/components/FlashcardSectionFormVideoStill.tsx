import React, { useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Tooltip, Card, CardMedia, CircularProgress } from '@material-ui/core'
import cn from 'classnames'
import * as r from '../redux'
import css from './FlashcardSection.module.css'

const VideoStillDisplay = ({
  videoFile,
  clip,
}: {
  videoFile: VideoFile
  clip: Clip
}) => {
  const { videoStill, mediaFileAvailability } = useSelector(
    (state: AppState) => ({
      videoStill: r.getFileWithAvailability<VideoStillImageFile>(
        state,
        'VideoStillImage',
        clip.id
      ),
      mediaFileAvailability: r.getFileAvailability(state, videoFile),
    })
  )

  const dispatch = useDispatch()

  useEffect(
    () => {
      dispatch(r.preloadVideoStills(videoFile, clip.id))
    },
    [clip.id, dispatch, videoFile]
  )
  const { filePath } = videoStill.availability

  const handleClick = useCallback(
    () => {
      dispatch(
        clip.flashcard.image
          ? r.removeFlashcardImage(clip.id)
          : r.addFlashcardImage(clip.id)
      )
    },
    [clip.flashcard.image, clip.id, dispatch]
  )

  return (
    <Tooltip
      title={
        clip.flashcard.image
          ? 'Click to leave out image'
          : 'Click to include image'
      }
    >
      <Card
        className={css.flashcardImageContainer}
        onClick={handleClick}
        style={{
          width: Math.round((videoFile.width / videoFile.height) * 85) + 'px',
          height: 85 + 'px',
        }}
      >
        <CardMedia
          className={cn(css.flashcardImage, {
            [css.flashcardImageUnused]: !clip.flashcard.image,
          })}
          image={filePath ? `file://${filePath}` : undefined}
        >
          {videoStill.availability.status !== 'CURRENTLY_LOADED' &&
          mediaFileAvailability.status === 'CURRENTLY_LOADED' ? (
            <CircularProgress />
          ) : null}
        </CardMedia>
      </Card>
    </Tooltip>
  )
}

export default VideoStillDisplay
