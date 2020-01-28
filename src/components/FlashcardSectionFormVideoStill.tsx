import React, { useCallback, useEffect, useMemo } from 'react'
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
  const {
    videoStill,
    mediaFileAvailability,
    clipsIds,
    videoStillAvailabilities,
  } = useSelector((state: AppState) => ({
    videoStill: r.getFileWithAvailability<VideoStillImageFile>(
      state,
      'VideoStillImage',
      clip.id
    ),
    mediaFileAvailability: r.getFileAvailability(state, videoFile),
    clipsIds: r.getClipIdsByMediaFileId(state, videoFile.id),
    videoStillAvailabilities: state.fileAvailabilities.VideoStillImage,
  }))

  const adjacentClipActions = useMemo(
    () => {
      const currentIndex = clipsIds.indexOf(clip.id)

      const adjacentIds = [
        clip.id,
        ...clipsIds.slice(currentIndex + 1, currentIndex + 5),
        ...clipsIds
          .slice(Math.max(currentIndex - 5, 0), currentIndex)
          .reverse(),
      ]
      return adjacentIds
        .map(id => {
          const availability =
            id in videoStillAvailabilities ? videoStillAvailabilities[id] : null
          if (!availability)
            return r.addAndOpenFile({
              type: 'VideoStillImage',
              id,
              mediaFileId: videoFile.id,
            })

          // MUST ADD VIDEOSTILLIMAGE FILES WHEN OPENING PROJECT

          const { status, isLoading } = availability
          return !isLoading && status !== 'CURRENTLY_LOADED'
            ? r.openFileRequest({
                type: 'VideoStillImage',
                id,
                mediaFileId: videoFile.id,
              })
            : null
        })
        .filter(a => a)
    },
    [clip.id, clipsIds, videoFile.id, videoStillAvailabilities]
  )

  const dispatch = useDispatch()

  useEffect(
    () => {
      const videoStillAction = () =>
        adjacentClipActions.forEach(a => dispatch(a))
      const timeout = window.setTimeout(videoStillAction, 500)

      return () => window.clearTimeout(timeout)
    },
    [
      clip.id,
      dispatch,
      videoFile.id,
      mediaFileAvailability.status,
      videoStill.availability.status,
      videoStill.file,
      adjacentClipActions,
    ]
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
