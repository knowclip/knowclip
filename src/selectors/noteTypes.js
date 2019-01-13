// @flow

export const getNoteTypeNames = (state: AppState): Array<string> =>
  state.noteTypes.allIds.map(id => state.noteTypes.byId[id].name)
