import React, { useState } from 'react'
import { connect } from 'react-redux'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@material-ui/core'
import * as r from '../../redux'
import { showOpenDialog } from '../../utils/electron'
import { getNoteTypeFields } from '../../utils/noteType'

const getOnClickLoadExternal = loadSubtitlesFromFile => async () => {
  const filePaths = await showOpenDialog([
    { name: 'Subtitles', extensions: ['srt', 'ass', 'vtt'] },
  ])
  if (!filePaths) return

  loadSubtitlesFromFile(filePaths[0])
}

const getDefaultFields = (currentNoteTypeFieldNames, firstSubtitlesTrackId) => {
  const fields = {}
  currentNoteTypeFieldNames.forEach(fieldName => {
    fields[fieldName] =
      fieldName === 'transcription' ? firstSubtitlesTrackId : ''
  })
  return fields
}

const trackMenuItem = (track, index) => (
  <MenuItem key={track.id} value={track.id}>
    {track.type === 'EmbeddedSubtitlesTrack' ? 'Embedded ' : 'External '}track
    {index + 1}
  </MenuItem>
)

const SubtitlesClipsDialog = ({
  open,
  closeDialog,
  currentNoteTypeFields,
  externalSubtitlesTracks,
  embeddedSubtitlesTracks,
  subtitlesTracks,
  currentFileId,
  makeClipsFromSubtitles,
  loadSubtitlesFromFile,
}) => {
  const [fields, setFields] = useState(() =>
    getDefaultFields(currentNoteTypeFields, subtitlesTracks[0].id)
  )

  const onSubmit = () => {
    const fieldsWithoutBlankValues = {}
    Object.keys(fields)
      .filter(fieldName => fields[fieldName])
      .forEach(fieldName => {
        fieldsWithoutBlankValues[fieldName] = fields[fieldName]
      })
    closeDialog()
    const tags = []
    return makeClipsFromSubtitles(currentFileId, fieldsWithoutBlankValues, tags)
  }
  const setField = (key, value) => {
    setFields(fields => ({
      ...fields,
      [key]: value,
    }))
  }

  return (
    <Dialog open={open}>
      <DialogContent>
        <form
          onSubmit={e => {
            e.preventDefault()
            onSubmit()
          }}
        >
          You currently have {subtitlesTracks.length} subtitles track
          {subtitlesTracks.length === 1 ? '' : 's'} loaded.
          <br />
          <br />
          <Button
            color="primary"
            variant="contained"
            onClick={getOnClickLoadExternal(loadSubtitlesFromFile)}
          >
            Load more subtitles
          </Button>
          <br />
          <br />
          <br />
          <FormControl fullWidth>
            <InputLabel htmlFor="transcription">Transcription</InputLabel>
            <Select
              inputProps={{ id: 'transcription', name: 'transcription' }}
              value={fields.transcription}
              onChange={e => setField('transcription', e.target.value)}
            >
              {embeddedSubtitlesTracks.map(trackMenuItem)}
              {externalSubtitlesTracks.map(trackMenuItem)}
            </Select>
          </FormControl>
          <br />
          <br />
          {currentNoteTypeFields.includes('pronunciation') && (
            <FormControl fullWidth>
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
          <br />
          <br />
          <FormControl fullWidth>
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
          <br />
          <br />
          <FormControl fullWidth>
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
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>Cancel</Button>
        <Button onClick={() => onSubmit()}>Ok</Button>
      </DialogActions>
    </Dialog>
  )
}

const mapStateToProps = state => ({
  currentNoteTypeFields: getNoteTypeFields(r.getCurrentNoteType(state)),
  externalSubtitlesTracks: r.getExternalSubtitlesTracks(state),
  embeddedSubtitlesTracks: r.getEmbeddedSubtitlesTracks(state),
  subtitlesTracks: r.getSubtitlesTracks(state),
  currentFileId: r.getCurrentFileId(state),
})

const mapDispatchToProps = {
  makeClipsFromSubtitles: r.makeClipsFromSubtitles,
  loadSubtitlesFromFile: r.loadSubtitlesFromFileRequest,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SubtitlesClipsDialog)
