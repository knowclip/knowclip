import React, { useState, useCallback, useEffect } from 'react'
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
  FormControlLabel,
  Checkbox,
} from '@material-ui/core'
import r from '../../redux'
import { showOpenDialog } from '../../utils/electron'
import { getNoteTypeFields } from '../../utils/noteType'
import TagsInput from '../TagsInput'
import { DialogProps } from './DialogProps'
import { MediaSubtitles, SubtitlesFileWithTrack } from '../../selectors'
import { TransliterationFlashcardFields } from '../../types/Project'
import { getFileFilters } from '../../utils/files'

enum $ {
  loadMoreTracksButton = 'subtitles-clips-load-more-tracks',
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
    currentFile,
    allTags,
    defaultTags,
    defaultIncludeStill,
  } = useSelector((state: AppState) => {
    const currentNoteType = r.getCurrentNoteType(state)
    return {
      noteType: currentNoteType,
      currentNoteTypeFields: currentNoteType
        ? getNoteTypeFields(currentNoteType)
        : [],
      subtitles: r.getSubtitlesFilesWithTracks(state),
      fieldsToTracks: r.getSubtitlesFlashcardFieldLinks(state),
      currentFile: r.getCurrentMediaFile(state),
      allTags: r.getAllTags(state),
      defaultTags: r.getDefaultTags(state),
      defaultIncludeStill: r.getDefaultIncludeStill(state),
    }
  })

  const currentFileId = currentFile ? currentFile.id : currentFile
  useEffect(() => {
    if (!currentFileId) {
      dispatch(MEDIA_FILE_MISSING_MESSAGE)
      dispatch(r.closeDialog())
    }
  }, [currentFileId, dispatch])

  const [state, setState] = useState(() => ({
    fields: fieldsToTracks,
    errorText: '',
  }))

  const { tags, onAddChip, onDeleteChip } = useTagsInput(defaultTags)

  const [useStills, setUseStills] = useState(defaultIncludeStill)
  const toggleUseStills = useCallback(
    (_e) => {
      setUseStills((v) => !v)
    },
    [setUseStills]
  )

  const closeDialog = useCallback(() => dispatch(r.closeDialog()), [dispatch])
  const onSubmit = useCallback(
    (_e) => {
      if (!currentFileId) return dispatch(MEDIA_FILE_MISSING_MESSAGE)

      const { fields } = state
      if (!Object.values(fields).find((v) => v && v.trim()))
        return setState((state) => ({
          ...state,
          errorText: 'Please choose at least one subtitles track.',
        }))

      const fieldsWithoutBlankValues: Partial<TransliterationFlashcardFields> =
        {}
      for (const fn in fields) {
        const fieldName = fn as TransliterationFlashcardFieldName
        const value = fields[fieldName]
        if (value) fieldsWithoutBlankValues[fieldName] = value
      }

      dispatch(r.closeDialog())
      dispatch(
        r.makeClipsFromSubtitles(
          currentFileId,
          fieldsWithoutBlankValues,
          tags,
          useStills
        )
      )
    },
    [currentFileId, dispatch, state, tags, useStills]
  )
  const setField = useCallback(
    (key: TransliterationFlashcardFieldName, value: SubtitlesTrackId) => {
      setState((state) => ({
        ...state,
        fields: {
          ...state.fields,
          [key]: value,
        },
        errorText: key === 'transcription' && value ? '' : state.errorText,
      }))
    },
    [setState]
  )

  const onClickLoadExternal = useCallback(async () => {
    if (!currentFileId) return dispatch(MEDIA_FILE_MISSING_MESSAGE)
    const filePaths = await showOpenDialog(
      getFileFilters('ExternalSubtitlesFile')
    )
    if (!filePaths) return

    dispatch(r.loadNewSubtitlesFile(filePaths[0], currentFileId))
  }, [dispatch, currentFileId])

  const onChangeTranscription = useCallback(
    (e) => {
      setField('transcription', e.target.value as string)
    },
    [setField]
  )
  const onChangePronunciation = useCallback(
    (e) => {
      setField('pronunciation', e.target.value as string)
    },
    [setField]
  )
  const onChangeMeaning = useCallback(
    (e) => {
      setField('meaning', e.target.value as string)
    },
    [setField]
  )
  const onChangeNotes = useCallback(
    (e) => {
      setField('notes', e.target.value as string)
    },
    [setField]
  )

  const { fields, errorText } = state

  return (
    <Dialog open={open}>
      <DialogContent>
        <form
          onSubmit={useCallback(
            (e) => {
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
            id={$.loadMoreTracksButton}
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
              {subtitlesTrackOptions(subtitles)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            {currentFile && currentFile.isVideo && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useStills}
                    onChange={toggleUseStills}
                    color="primary"
                  />
                }
                label="Include still images from video in flashcards"
                labelPlacement="start"
              />
            )}
          </FormControl>
          <FormControl fullWidth margin="normal">
            <TagsInput
              allTags={allTags}
              tags={tags}
              onAddChip={onAddChip}
              onDeleteChip={onDeleteChip}
            />
          </FormControl>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog} id={$.cancelButton} color="primary">
          Cancel
        </Button>
        <Button onClick={onSubmit} id={$.okButton} color="primary">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const subtitlesTrackOptions = ({ external, embedded }: MediaSubtitles) => [
  <MenuItem value="">None</MenuItem>,
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
      setTags((tags) => (tags.includes(text) ? tags : tags.concat(text))),
    []
  )
  const onDeleteChip = useCallback(
    (index: number) => setTags((tags) => tags.filter((t, i) => i !== index)),
    []
  )

  return { tags, onAddChip, onDeleteChip }
}
export default SubtitlesClipsDialog

export { $ as subtitleClipsDialog$ }
