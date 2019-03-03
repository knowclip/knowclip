import { map } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'

const deleteNoteTypeEpic = (action$, state$) =>
  action$.pipe(
    ofType('DELETE_NOTE_TYPE_REQUEST'),
    map(({ id }) => {
      const currentFile = r.getCurrentFile(state$.value)
      return currentFile && currentFile.noteTypeId === id
        ? r.simpleMessageSnackbar(
            "You can't delete this note type while it's currently in use."
          )
        : r.deleteNoteType(id)
    })
  )

const editNoteTypeEpic = (action$, state$) =>
  action$.pipe(
    ofType('EDIT_NOTE_TYPE_REQUEST'),
    map(({ id, override }) => {
      const oldNoteType = r.getNoteType(state$.value, id)
      const newFieldIds = override.fields.map(f => f.id)
      const deletedFields = oldNoteType.fields.filter(
        ({ id }) => !newFieldIds.includes(id)
      )

      return deletedFields.length // this could be smarter -- check if the fields have content?
        ? r.confirmationDialog(
            `You've deleted these fields: ${deletedFields
              .map(f => f.name)
              .join(
                ', '
              )}. If you save these changes, you'll delete these fields from all the cards you've made, too. Are you sure you want to continue?.`,
            r.editNoteType(id, override)
          )
        : r.editNoteType(id, override)
    })
  )

const setAudioFileNoteTypeEpic = (action$, state$) =>
  action$.pipe(
    ofType('SET_AUDIO_FILE_NOTE_TYPE_REQUEST'),
    map(({ audioFilePath, noteTypeId }) => {
      const noteType = r.getNoteType(state$.value, noteTypeId)
      if (noteTypeId === r.getCurrentNoteType(state$.value).id)
        return r.simpleMessageSnackbar(
          `You're already using "${noteType.name}".`
        )

      return r.doesFileHaveClips(state$.value, audioFilePath)
        ? r.confirmationDialog(
            `You've already started making flashcards with this note type; discard your work and use ${
              noteType.name
            }?`,
            r.setAudioFileNoteType(audioFilePath, noteTypeId)
          )
        : r.setAudioFileNoteType(audioFilePath, noteTypeId)
    })
  )

export default combineEpics(
  deleteNoteTypeEpic,
  editNoteTypeEpic,
  setAudioFileNoteTypeEpic
)
