export const getNoteTypeFields = (noteType: NoteType) =>
  noteType === 'Transliteration'
    ? ['transcription', 'pronunciation', 'meaning', 'notes']
    : ['transcription', 'meaning', 'notes']

export const getBlankFlashcard: <T extends FlashcardFields>(
  id: ClipId,
  flashcardFieldsExample: T,
  tags: Array<string>
) => Flashcard = (id, flashcardFieldsExample, tags) =>
  flashcardFieldsExample.hasOwnProperty('pronunciation')
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
