// @flow

export const getNoteTypes = (state: AppState): Array<NoteType> =>
  state.noteTypes.allIds.map(id => state.noteTypes.byId[id])

export const getNoteType = (state: AppState, id: NoteTypeId): ?NoteType =>
  state.noteTypes.byId[id]
