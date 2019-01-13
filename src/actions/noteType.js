// @flow

export const addNoteType = (noteType: NoteType): NoteTypeAction => ({
  type: 'ADD_NOTE_TYPE',
  noteType,
})

export const editNoteType = (
  id: NoteTypeId,
  override: $Shape<NoteType>
): NoteTypeAction => ({
  type: 'EDIT_NOTE_TYPE',
  id,
  override,
})

export const setDefaultNoteType = (id: NoteTypeId): NoteTypeAction => ({
  type: 'SET_DEFAULT_NOTE_TYPE',
  id,
})
