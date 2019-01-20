// @flow

declare type NoteTypesState = {
  byId: { [NoteTypeId]: NoteType },
  allIds: Array<NoteTypeId>,
  defaultId: NoteTypeId,
}

declare type NoteTypeId = string

declare type NoteType = {
  id: NoteTypeId,
  name: string,
  fields: Array<NoteTypeField>,
}

declare type NoteFieldId = string
declare type NoteFieldName = string

declare type NoteTypeField = {
  id: NoteFieldId,
  name: NoteFieldName,
}
