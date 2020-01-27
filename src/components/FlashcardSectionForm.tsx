import React, { useCallback, useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Card,
  CardMedia,
  CardContent,
} from '@material-ui/core'
import { Delete as DeleteIcon, Loop } from '@material-ui/icons'
import formatTime from '../utils/formatTime'
import * as r from '../redux'
import css from './FlashcardSection.module.css'
import { getNoteTypeFields } from '../utils/noteType'
import TagsInput from './TagsInput'
import * as actions from '../actions'
import Field from './FlashcardSectionFormField'

enum $ {
  container = 'flashcard-form-container',
  flashcardFields = 'flashcard-field',
  deleteButton = 'delete-clip-button',
}

const FlashcardSectionForm = ({
  className,
  mediaFile,
  clip,
}: {
  className?: string
  mediaFile: MediaFile
  clip: Clip
}) => {
  const {
    allTags,
    selectedClipTime,
    currentNoteType,
    isLoopOn,
    subtitlesFlashcardFieldLinks,
  } = useSelector((state: AppState) => ({
    allTags: r.getAllTags(state),
    selectedClipTime: r.getSelectedClipTime(state),
    currentNoteType: r.getCurrentNoteType(state),
    isLoopOn: r.isLoopOn(state),
    subtitlesFlashcardFieldLinks: r.getSubtitlesFlashcardFieldLinks(state),
  }))

  if (!selectedClipTime) throw new Error('Clip not found')

  const { flashcard } = clip

  const [moreMenuAnchorEl, setMoreMenuAnchorEl] = useState(null)

  const dispatch = useDispatch()

  const toggleLoop = useCallback(() => dispatch(actions.toggleLoop()), [
    dispatch,
  ])
  const loopOnInteract = useCallback(
    () => {
      const media = document.getElementById('mediaPlayer')
      const mediaIsPlaying =
        media && !(media as HTMLVideoElement | HTMLAudioElement).paused
      if (mediaIsPlaying && !isLoopOn) dispatch(actions.setLoop(true))
    },
    [dispatch, isLoopOn]
  )
  const [focusedOnLoad, setFocusedOnLoad] = useState(false)
  const handleFocus = useCallback(
    () => {
      if (!focusedOnLoad) return setFocusedOnLoad(true)

      loopOnInteract()
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
    (index, text) => dispatch(actions.deleteFlashcardTag(clip.id, index, text)),
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
              inputProps={{
                className: $.flashcardFields,
                style: { minHeight: '20px' },
              }}
              onKeyDown={loopOnInteract}
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

const capitalize = (string: string) =>
  string.substring(0, 1).toUpperCase() + string.slice(1)

export default FlashcardSectionForm

export { $ as flashcardSectionForm$ }

const VideoStillDisplay = ({
  videoFile,
  clip,
}: {
  videoFile: MediaFile
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
      const videoStillLoaded =
        videoStill.availability.status === 'CURRENTLY_LOADED'
      if (
        !videoStillLoaded &&
        mediaFileAvailability.status === 'CURRENTLY_LOADED'
      )
        dispatch(
          videoStill.file
            ? r.openFileRequest(videoStill.file)
            : r.addAndOpenFile({
                type: 'VideoStillImage',
                id: clip.id,
                mediaFileId: videoFile.id,
              })
        )
    },
    [
      clip.id,
      dispatch,
      videoFile.id,
      mediaFileAvailability.status,
      videoStill.availability.status,
      videoStill.file,
    ]
  )

  const { filePath } = videoStill.availability

  return (
    <Card className={css.flashcardImageContainer}>
      <CardMedia
        className={css.flashcardImage}
        component="img"
        alt="Video still"
        image={filePath ? `file://${filePath}` : undefined}
      />
    </Card>
  )
}
// const getVideoStill = (state: AppState, mediaFile: MediaFile, clip: Clip): FileWithAvailability<VideoStillImageFile> => {
//   const id = clip.flashcard.image && clip.flashcard.image.id
//   return id? r.getFileWithAvailability(state, 'VideoStillImage', id) : null
// }
