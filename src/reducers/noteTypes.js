// @flow

const initialState: NoteTypesState = {
  noteTypes: [],
  noteTypeAssignments: {},
}

export default function noteTypes(
  state: UserState = initialState,
  action: Object
): NoteTypesState {
  switch (action.type) {
    case 'ADD_NOTE_TYPE':
    case 'EDIT_NOTE_TYPE':
    case 'DELETE_NOTE_TYPE':
    default:
      return state
  }
}
