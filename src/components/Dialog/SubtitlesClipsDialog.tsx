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
} from '@material-ui/core'
import * as r from '../../redux'
import { showOpenDialog } from '../../utils/electron'
import { getNoteTypeFields } from '../../utils/noteType'
import TagsInput from '../TagsInput'
import { DialogProps } from './DialogProps'
import {
  loadSubtitlesFromFileRequest,
  makeClipsFromSubtitles,
  closeDialog,
} from '../../actions'

const getDefaultFields = (
  currentNoteTypeFieldNames: TransliterationFlashcardFieldName[],
  firstSubtitlesTrackId: string
) => {
  const fields: Partial<TransliterationFlashcardFields> = {}
  currentNoteTypeFieldNames.forEach(fieldName => {
    fields[fieldName] =
      fieldName === 'transcription' ? firstSubtitlesTrackId : ''
  })
  return fields
}

const trackMenuItem = (track: SubtitlesTrack, index: number) => (
  <MenuItem key={track.id} value={track.id}>
    {track.type === 'EmbeddedSubtitlesTrack' ? 'Embedded ' : 'External '}track{' '}
    {index + 1}
  </MenuItem>
)

const MEDIA_FILE_MISSING_MESSAGE = r.simpleMessageSnackbar(
  'Please select a media file before continuing.'
)

const SubtitlesClipsDialog = ({
  open,
}: DialogProps<SubtitlesClipsDialogData>) => {
  const dispatch = useDispatch()
  const {
    currentNoteTypeFields,
    externalSubtitlesTracks,
    embeddedSubtitlesTracks,
    subtitlesTracks,
    currentFileId,
    allTags,
  } = useSelector((state: AppState) => {
    const currentNoteType = r.getCurrentNoteType(state)
    return {
      currentNoteTypeFields: currentNoteType
        ? getNoteTypeFields(currentNoteType)
        : [],
      externalSubtitlesTracks: r.getExternalSubtitlesTracks(state),
      embeddedSubtitlesTracks: r.getEmbeddedSubtitlesTracks(state),
      subtitlesTracks: r.getSubtitlesTracks(state),
      currentFileId: r.getCurrentFileId(state),
      allTags: r.getAllTags(state),
    }
  })

  const [fields, setFields] = useState(() =>
    getDefaultFields(currentNoteTypeFields, subtitlesTracks[0].id)
  )
  const [tags, setTags] = useState<Array<string>>([])
  const onAddChip = useCallback(
    (text: string) =>
      setTags(tags => (tags.includes(text) ? tags : tags.concat(text))),
    []
  )
  const onDeleteChip = useCallback(
    (index: number) => setTags(tags => tags.filter((t, i) => i !== index)),
    []
  )

  const onSubmit = useCallback(
    e => {
      if (!currentFileId) return dispatch(MEDIA_FILE_MISSING_MESSAGE)
      const fieldsWithoutBlankValues: Partial<
        TransliterationFlashcardFields
      > = {}
      ;(Object.keys(fields) as TransliterationFlashcardFieldName[]).forEach(
        fieldName => {
          const value = fields[fieldName]
          if (value) fieldsWithoutBlankValues[fieldName] = value
        }
      )
      dispatch(closeDialog())
      dispatch(
        makeClipsFromSubtitles(currentFileId, fieldsWithoutBlankValues, tags)
      )
    },
    [dispatch, fields, currentFileId, tags]
  )
  const setField = useCallback(
    (key: TransliterationFlashcardFieldName, value: string) => {
      setFields(fields => ({
        ...fields,
        [key]: value,
      }))
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
          You currently have {subtitlesTracks.length} subtitles track
          {subtitlesTracks.length === 1 ? '' : 's'} loaded.
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
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="transcription">Transcription</InputLabel>
            <Select
              inputProps={{ id: 'transcription', name: 'transcription' }}
              value={fields.transcription}
              onChange={e => {
                setField('transcription', e.target.value)
              }}
            >
              {embeddedSubtitlesTracks.map(trackMenuItem)}
              {externalSubtitlesTracks.map(trackMenuItem)}
            </Select>
          </FormControl>
          {currentNoteTypeFields.includes('pronunciation') && (
            <FormControl fullWidth margin="normal">
              <InputLabel htmlFor="pronunciation">Pronunciation</InputLabel>
              <Select
                inputProps={{ id: 'pronunciation', name: 'pronunciation' }}
                value={fields.pronunciation}
                onChange={e => setField('pronunciation', e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {embeddedSubtitlesTracks.map(trackMenuItem)}
                {externalSubtitlesTracks.map(trackMenuItem)}
              </Select>
            </FormControl>
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="meaning">Meaning</InputLabel>
            <Select
              inputProps={{ id: 'meaning', name: 'meaning' }}
              value={fields.meaning}
              onChange={e => setField('meaning', e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {embeddedSubtitlesTracks.map(trackMenuItem)}
              {externalSubtitlesTracks.map(trackMenuItem)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="notes">Notes</InputLabel>
            <Select
              inputProps={{ id: 'notes', name: 'notes' }}
              value={fields.notes}
              onChange={e => setField('notes', e.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {embeddedSubtitlesTracks.map(trackMenuItem)}
              {externalSubtitlesTracks.map(trackMenuItem)}
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
        <Button onClick={closeDialog}>Cancel</Button>
        <Button onClick={onSubmit}>Ok</Button>
      </DialogActions>
    </Dialog>
  )
}

export default SubtitlesClipsDialog
