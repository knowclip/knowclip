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
} from '@material-ui/core'
import { DialogProps } from './DialogProps'
import {
  closeDialog,
  linkFlashcardFieldToSubtitlesTrackRequest,
} from '../../actions'
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

enum $ {
  container = 'link-subtitles-dialog-container',
  skipButton = 'link-subtitles-dialog-skip-button',
}

const LinkSubtitlesDialog = ({
  open,
  data: { subtitles, mediaFileId },
}: DialogProps<LinkSubtitlesDialogData>) => {
  const dispatch = useDispatch()

  const {
    mediaFile,
    fieldsToTracks,
    blankFields,
    mediaSubtitles,
  } = useSelector((state: AppState) => ({
    mediaFile: getCurrentMediaFile(state),
    fieldsToTracks: getSubtitlesFlashcardFieldLinks(state),
    blankFields:
      getCurrentNoteType(state) === 'Simple'
        ? blankSimpleFields
        : blankTransliterationFields,
    mediaSubtitles: getSubtitlesFilesWithTracks(state),
  }))

  const fieldNames = Object.keys(blankFields)
  const [fieldSelection, setFieldSelection] = useState(
    () =>
      (fieldNames.find(
        fieldName =>
          !fieldsToTracks[fieldName as TransliterationFlashcardFieldName]
      ) as TransliterationFlashcardFieldName) || ''
  )
  const onChangeField = useCallback(e => {
    setFieldSelection(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    e => {
      e.preventDefault()
      dispatch(
        linkFlashcardFieldToSubtitlesTrackRequest(
          fieldSelection,
          mediaFileId,
          subtitles.id
        )
      )
      dispatch(closeDialog())
    },
    [dispatch, fieldSelection, mediaFileId, subtitles.id]
  )

  const close = useCallback(() => dispatch(closeDialog()), [dispatch])

  const fieldNamesToTrackLabels = useMemo(
    () => {
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
    },
    [mediaSubtitles.all, fieldsToTracks]
  )

  if (!mediaFile) {
    dispatch(closeDialog())
    return null
  }

  const prompt =
    subtitles.type === 'ExternalSubtitlesFile' ? (
      <p>
        Would you like to link this subtitles track to a specific flashcard
        field to help you create flashcards?
        <br />
        <br />
        You can always change this later.
      </p>
    ) : (
      <p>
        An embedded subtitles track was detected in this media file!
        <br />
        <br />
        Would you like to link this track to a flashcard field to help you
        create flashcards?
        <br />
        <br />
        You can always change this later.
      </p>
    )

  return (
    <Dialog open={open}>
      <form onSubmit={handleSubmit} id={$.container}>
        <DialogContent>
          {prompt}
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="field">Field</InputLabel>
            <Select value={fieldSelection} onChange={onChangeField}>
              {fieldNames.map(fieldName => {
                const label =
                  fieldNamesToTrackLabels[
                    fieldName as TransliterationFlashcardFieldName
                  ]
                return (
                  <MenuItem value={fieldName} key={fieldName}>
                    {fieldName} {label && `(Replace ${label})`}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} id={$.skipButton}>
            Skip
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
