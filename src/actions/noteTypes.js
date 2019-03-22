// @flow

export const addNoteType = (noteType: NoteType): NoteTypeAction => ({
  type: 'ADD_NOTE_TYPE',
  noteType,
})

export const deleteNoteType = (
  id: NoteTypeId,
  closeDialogOnComplete: boolean = false
): NoteTypeAction => ({
  type: 'DELETE_NOTE_TYPE',
  id,
  closeDialogOnComplete,
})

export const deleteNoteTypeRequest = (
  id: NoteTypeId,
  closeDialogOnComplete: boolean = false
): NoteTypeAction => ({
  type: 'DELETE_NOTE_TYPE_REQUEST',
  id,
  closeDialogOnComplete,
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
