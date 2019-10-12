declare type NoteType = 'Simple' | 'Transliteration'

declare type NoteTypeId = string

declare type NoteTypePre3_0_0 = {
  id: NoteTypeId
  name: string
  fields: Array<NoteTypeField>
  useTagsField: boolean
}

declare type NoteFieldId = string
declare type NoteFieldName = string

declare type NoteTypeField = {
  id: NoteFieldId
  name: NoteFieldName
}
