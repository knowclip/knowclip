import React, { useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
} from '@material-ui/core'
import * as r from '../../redux'
import { showOpenDialog } from '../../utils/electron'
import { getNoteTypeFields } from '../../utils/noteType'
import TagsInput from '../TagsInput'
import { DialogProps } from './DialogProps'
import {
  loadSubtitlesFromFileRequest,
  makeClipsFromSubtitles,
} from '../../actions'
import { SubtitlesFileWithTrack } from '../../redux'
import { MediaSubtitles } from '../../selectors'

enum $ {
  transcriptionField = 'subtitles-clips-transcription-field',
  pronunciationField = 'subtitles-clips-pronunciation-field',
  meaningField = 'subtitles-clips-meaning-field',
  notesField = 'subtitles-clips-notes-field',
  selectFieldOption = 'subtitles-clips-select-field-option',
  tagsField = 'subtitles-clips-tags-field',
  cancelButton = 'subtitles-clips-dialog-cancel-button',
  okButton = 'subtitles-clips-dialog-ok-button',
}

const MEDIA_FILE_MISSING_MESSAGE = r.simpleMessageSnackbar(
  'Please select a media file before continuing.'
)

const SubtitlesClipsDialog = ({
  open,
}: DialogProps<SubtitlesClipsDialogData>) => {
  const dispatch = useDispatch()
  const {
    currentNoteTypeFields,
    subtitles,
    fieldsToTracks,
    currentFileId,
    allTags,
    defaultTags,
  } = useSelector((state: AppState) => {
    const currentNoteType = r.getCurrentNoteType(state)
    return {
      noteType: currentNoteType,
      currentNoteTypeFields: currentNoteType
        ? getNoteTypeFields(currentNoteType)
        : [],
      subtitles: r.getSubtitlesFilesWithTracks(state),
      fieldsToTracks: r.getSubtitlesFlashcardFieldLinks(state),
      currentFileId: r.getCurrentFileId(state),
      allTags: r.getAllTags(state),
      defaultTags: r.getDefaultTags(state),
    }
  })

  const [fields, setFields] = useState(fieldsToTracks)
  const { tags, onAddChip, onDeleteChip } = useTagsInput(defaultTags)
  const [errorText, setErrorText] = useState('')

  const closeDialog = useCallback(() => dispatch(r.closeDialog()), [dispatch])
  const onSubmit = useCallback(
    e => {
      if (!currentFileId) return dispatch(MEDIA_FILE_MISSING_MESSAGE)

      const transcriptionTrackId = fields.transcription

      if (!transcriptionTrackId)
        return setErrorText(
          'This field is necessary to automatically make clips.'
        )

      const fieldsWithoutBlankValues: Partial<
        TransliterationFlashcardFields
      > & { transcription: string } = { transcription: transcriptionTrackId }

      for (const fn in fields) {
        const fieldName = fn as TransliterationFlashcardFieldName
        const value = fields[fieldName]
        if (value) fieldsWithoutBlankValues[fieldName] = value
      }

      dispatch(r.closeDialog())
      dispatch(
        makeClipsFromSubtitles(currentFileId, fieldsWithoutBlankValues, tags)
      )
    },
    [dispatch, fields, currentFileId, tags]
  )
  const setField = useCallback(
    (key: TransliterationFlashcardFieldName, value: SubtitlesTrackId) => {
      setFields(fields => ({
        ...fields,
        [key]: value,
      }))
      if (key === 'transcription' && value) setErrorText('')
    },
    [setFields]
  )

  const onClickLoadExternal = useCallback(
    async () => {
      if (!currentFileId) return dispatch(MEDIA_FILE_MISSING_MESSAGE)
      const filePaths = await showOpenDialog([
        { name: 'Subtitles', extensions: ['srt', 'ass', 'vtt'] },
      ])
      if (!filePaths) return

      dispatch(loadSubtitlesFromFileRequest(filePaths[0], currentFileId))
    },
    [dispatch, currentFileId]
  )

  const onChangeTranscription = useCallback(
    e => {
      setField('transcription', e.target.value as string)
    },
    [setField]
  )
  const onChangePronunciation = useCallback(
    e => {
      setField('pronunciation', e.target.value as string)
    },
    [setField]
  )
  const onChangeMeaning = useCallback(
    e => {
      setField('meaning', e.target.value as string)
    },
    [setField]
  )
  const onChangeNotes = useCallback(
    e => {
      setField('notes', e.target.value as string)
    },
    [setField]
  )

  return (
    <Dialog open={open}>
      <DialogContent>
        <form
          onSubmit={useCallback(
            e => {
              e.preventDefault()
              onSubmit(e)
            },
            [onSubmit]
          )}
        >
          You currently have {subtitles.total} subtitles track
          {subtitles.total === 1 ? '' : 's'} loaded.
          <br />
          <br />
          <Button
            color="primary"
            variant="contained"
            onClick={onClickLoadExternal}
          >
            Load more subtitles
          </Button>
          <br />
          <br />
          <FormControl
            fullWidth
            margin="normal"
            error={Boolean(errorText.trim())}
          >
            <InputLabel htmlFor="transcription">Transcription</InputLabel>
            <Select
              value={fields.transcription || ''}
              onChange={onChangeTranscription}
              id={$.transcriptionField}
            >
              {subtitlesTrackOptions(subtitles)}
            </Select>
            {errorText.trim() && <FormHelperText>{errorText}</FormHelperText>}
          </FormControl>
          {currentNoteTypeFields.includes('pronunciation') && (
            <FormControl fullWidth margin="normal">
              <InputLabel htmlFor="pronunciation">Pronunciation</InputLabel>
              <Select
                value={fields.pronunciation || ''}
                onChange={onChangePronunciation}
                id={$.pronunciationField}
              >
                <MenuItem value="">None</MenuItem>
                {subtitlesTrackOptions(subtitles)}
              </Select>
            </FormControl>
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="meaning">Meaning</InputLabel>
            <Select
              value={fields.meaning || ''}
              onChange={onChangeMeaning}
              id={$.meaningField}
            >
              <MenuItem value="">None</MenuItem>
              {subtitlesTrackOptions(subtitles)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="notes">Notes</InputLabel>
            <Select
              value={fields.notes || ''}
              onChange={onChangeNotes}
              id={$.notesField}
            >
              <MenuItem value="">None</MenuItem>
              {subtitlesTrackOptions(subtitles)}
            </Select>
          </FormControl>
          <TagsInput
            allTags={allTags}
            tags={tags}
            onAddChip={onAddChip}
            onDeleteChip={onDeleteChip}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} id={$.cancelButton}>
          Cancel
        </Button>
        <Button onClick={onSubmit} id={$.okButton}>
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const subtitlesTrackOptions = ({ external, embedded }: MediaSubtitles) => [
  ...embedded.map(trackMenuItem),
  ...external.map(trackMenuItem),
]
const trackMenuItem = (track: SubtitlesFileWithTrack, index: number) => (
  <MenuItem
    key={track.relation.id}
    value={track.relation.id}
    className={$.selectFieldOption}
  >
    {track.relation.type === 'EmbeddedSubtitlesTrack'
      ? 'Embedded '
      : 'External '}
    track {index + 1}
  </MenuItem>
)

function useTagsInput(defaultTags: string[]) {
  const [tags, setTags] = useState<Array<string>>(defaultTags)
  const onAddChip = useCallback(
    (text: string) =>
      setTags(tags => (tags.includes(text) ? tags : tags.concat(text))),
    []
  )
  const onDeleteChip = useCallback(
    (index: number) => setTags(tags => tags.filter((t, i) => i !== index)),
    []
  )

  return { tags, onAddChip, onDeleteChip }
}
export default SubtitlesClipsDialog

export { $ as subtitleClipsDialog$ }
