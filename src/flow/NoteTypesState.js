// @flow

declare type NoteTypesState = {
  byId: { [NoteTypeId]: NoteType },
  allIds: Array<NoteTypeId>,
}

declare type NoteTypeId = string

declare type NoteType = {
  id: NoteTypeId,
  name: string,
  fields: Array<NoteTypeField>,
}

declare type NoteFieldName = string

declare type NoteTypeField = {
  name: NoteFieldName,
}

declare type NoteField = {
  name: NoteFieldName,
  value: string,
}
