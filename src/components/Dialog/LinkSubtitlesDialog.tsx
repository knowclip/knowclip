import React, { useCallback, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Dialog,
  DialogContent,
  Button,
  DialogActions,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
} from '@mui/material'
import { DialogProps } from './DialogProps'
import { actions } from '../../actions'
import {
  getSubtitlesFlashcardFieldLinks,
  getCurrentNoteType,
  getCurrentMediaFile,
  getSubtitlesFilesWithTracks,
} from '../../selectors'
import {
  blankSimpleFields,
  blankTransliterationFields,
} from '../../utils/newFlashcard'
import { capitalize } from '../FlashcardSectionForm'
import { formatDurationWithMilliseconds } from '../../utils/formatTime'
import moment from 'moment'

enum $ {
  container = 'link-subtitles-dialog',
  form = 'link-subtitles-dialog-form',
  skipButton = 'link-subtitles-dialog-skip-button',
}

const LinkSubtitlesDialog = ({
  open,
  data: { subtitles, subtitlesChunks, mediaFileId, triggeredOnOpenFile },
}: DialogProps<LinkSubtitlesDialogData>) => {
  const dispatch = useDispatch()

  const { mediaFile, subs, fieldsToTracks, blankFields, mediaSubtitles } =
    useSelector((state: AppState) => ({
      mediaFile: getCurrentMediaFile(state),
      subs: getSubtitlesFilesWithTracks(state),
      fieldsToTracks: getSubtitlesFlashcardFieldLinks(state),
      blankFields:
        getCurrentNoteType(state) === 'Simple'
          ? blankSimpleFields
          : blankTransliterationFields,
      mediaSubtitles: getSubtitlesFilesWithTracks(state),
    }))

  const currentlyLinkedField = useMemo(() => {
    const trackWithFile = subs.all.find((t) => t.id === subtitles.id)
    const trackId = trackWithFile?.track?.id
    if (!trackId) return undefined
    const [field] =
      Object.entries(fieldsToTracks).find(([, track]) => track === trackId) ||
      []
    return field as TransliterationFlashcardFieldName
  }, [fieldsToTracks, subs.all, subtitles.id])

  const fieldNames = Object.keys(blankFields)
  const [fieldSelection, setFieldSelection] = useState<
    TransliterationFlashcardFieldName | ''
  >(
    () =>
      currentlyLinkedField ||
      (fieldNames.find(
        (fieldName) =>
          !fieldsToTracks[fieldName as TransliterationFlashcardFieldName]
      ) as TransliterationFlashcardFieldName) ||
      ''
  )
  const onChangeField = useCallback((e) => {
    setFieldSelection(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      if (fieldSelection && fieldSelection !== currentlyLinkedField)
        dispatch(
          actions.linkFlashcardFieldToSubtitlesTrackRequest(
            fieldSelection,
            mediaFileId,
            subtitles.id
          )
        )
      else if (currentlyLinkedField)
        dispatch(
          actions.linkFlashcardFieldToSubtitlesTrack(
            currentlyLinkedField,
            mediaFileId,
            null
          )
        )
      dispatch(actions.closeDialog())
    },
    [currentlyLinkedField, dispatch, fieldSelection, mediaFileId, subtitles.id]
  )

  const close = useCallback(() => dispatch(actions.closeDialog()), [dispatch])

  const fieldNamesToTrackLabels = useMemo(() => {
    const fieldNamesToTrackLabels = {} as SubtitlesFlashcardFieldsLinks
    for (const fn in fieldsToTracks) {
      const fieldName = fn as TransliterationFlashcardFieldName
      const linkedSubtitlesTrackId = fieldsToTracks[fieldName]
      const track = mediaSubtitles.all.find(
        ({ relation }) => relation.id === linkedSubtitlesTrackId
      )
      if (track) fieldNamesToTrackLabels[fieldName] = track.label
    }
    return fieldNamesToTrackLabels
  }, [mediaSubtitles.all, fieldsToTracks])

  if (!mediaFile) {
    dispatch(actions.closeDialog())
    return null
  }

  const chunksDisplay = (
    <pre
      style={{
        height: '200px',
        overflow: 'auto',
        backgroundColor: '#eeeeee',
        padding: '1em',
        whiteSpace: 'pre-line',
      }}
    >
      {subtitlesChunks.slice(0, 100).map(({ text, start }) => (
        <React.Fragment key={String(start)}>
          <span>
            {formatDurationWithMilliseconds(moment.duration(start)).padStart(
              10
            )}
          </span>{' '}
          {text.split(/\n+/).map((t) => '  ' + t)}
          <br />
        </React.Fragment>
      ))}
      {subtitlesChunks.length > 100 ? <>'...'</> : null}
    </pre>
  )

  const prompt =
    subtitles.type === 'ExternalSubtitlesFile' ? (
      <>
        {triggeredOnOpenFile && (
          <p>An external subtitles file was detected for this media file!</p>
        )}
        <p>
          Would you like to link this subtitles track to a specific flashcard
          field to help you create flashcards? (You can change this later in the
          subtitles menu.)
        </p>
        <h3>{subtitles.name}</h3>
        {chunksDisplay}
      </>
    ) : (
      <>
        {triggeredOnOpenFile && (
          <p>An embedded subtitles track was detected in this media file!</p>
        )}
        <p>
          Would you like to link this subtitles track to a specific flashcard
          field to help you create flashcards? (You can change this later in the
          subtitles menu.)
        </p>
        {chunksDisplay}
      </>
    )

  return (
    <Dialog open={open} className={$.container}>
      <form onSubmit={handleSubmit} id={$.form}>
        <DialogContent>
          {prompt}
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="field">Field</InputLabel>
            <Select value={fieldSelection} onChange={onChangeField}>
              {fieldNames.map((fieldName) => {
                const currentlyLinkedToThisField =
                  currentlyLinkedField === fieldName

                const label =
                  fieldNamesToTrackLabels[
                    fieldName as TransliterationFlashcardFieldName
                  ]
                return (
                  <MenuItem value={fieldName} key={fieldName}>
                    {capitalize(fieldName)}{' '}
                    {!currentlyLinkedToThisField &&
                      label &&
                      `(Replace ${label})`}
                  </MenuItem>
                )
              })}
              {!triggeredOnOpenFile && <MenuItem value="">None</MenuItem>}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} id={$.skipButton}>
            {triggeredOnOpenFile ? <>Skip</> : <>Cancel</>}
          </Button>
          <Button variant="contained" color="primary" type="submit">
            Link subtitles to chosen flashcard field
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default LinkSubtitlesDialog

export { $ as linkSubtitlesDialog$ }
