// @flow

export const getNoteTypes = (state: AppState): Array<NoteType> =>
  state.noteTypes.allIds.map(id => state.noteTypes.byId[id])

export const getNoteTypeNames = (state: AppState): Array<string> =>
  state.noteTypes.allIds.map(id => state.noteTypes.byId[id].name)

export const getNoteType = (state: AppState, id: NoteTypeId): ?NoteType =>
  state.noteTypes.byId[id]

export const getDefaultNoteTypeId = (
  state: AppState,
  id: NoteTypeId
): ?NoteTypeId => state.noteTypes.defaultId
