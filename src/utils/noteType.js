// @flow
export const getNoteTypeFields = (
  noteType: NoteType
): Array<FlashcardFieldName> =>
  noteType === 'Transliteration'
    ? ['transcription', 'pronunciation', 'meaning', 'notes']
    : ['transcription', 'meaning', 'notes']

export const getBlankFlashcard = (
  id: ClipId,
  noteType: NoteType,
  tags: Array<string>
): Flashcard =>
  noteType === 'Transliteration'
    ? {
        id,
        type: 'Transliteration',
        fields: {
          transcription: '',
          pronunciation: '',
          meaning: '',
          notes: '',
        },
        tags: tags,
      }
    : {
        id,
        type: 'Simple',
        fields: {
          transcription: '',
          meaning: '',
          notes: '',
        },
        tags: tags,
      }
