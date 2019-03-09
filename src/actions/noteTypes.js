// @flow

export const addNoteType = (noteType: NoteType): NoteTypeAction => ({
  type: 'ADD_NOTE_TYPE',
  noteType,
})

export const deleteNoteType = (id: NoteTypeId): NoteTypeAction => ({
  type: 'DELETE_NOTE_TYPE',
  id,
})

export const deleteNoteTypeRequest = (id: NoteTypeId): NoteTypeAction => ({
  type: 'DELETE_NOTE_TYPE_REQUEST',
  id,
})

export const editNoteType = (
  id: NoteTypeId,
  override: $Shape<NoteType>
): NoteTypeAction => ({
  type: 'EDIT_NOTE_TYPE',
  id,
  override,
})

export const editNoteTypeRequest = (
  id: NoteTypeId,
  override: $Shape<NoteType>
): NoteTypeAction => ({
  type: 'EDIT_NOTE_TYPE_REQUEST',
  id,
  override,
})

export const setDefaultNoteType = (id: NoteTypeId): NoteTypeAction => ({
  type: 'SET_DEFAULT_NOTE_TYPE',
  id,
})

export const setAudioFileNoteType = (
  audioFileId: AudioFileId,
  noteTypeId: NoteTypeId
): NoteTypeAction => ({
  type: 'SET_AUDIO_FILE_NOTE_TYPE',
  audioFileId,
  noteTypeId,
})

export const setAudioFileNoteTypeRequest = (
  audioFileId: AudioFileId,
  noteTypeId: NoteTypeId
): NoteTypeAction => ({
  type: 'SET_AUDIO_FILE_NOTE_TYPE_REQUEST',
  audioFileId,
  noteTypeId,
})
