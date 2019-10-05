const SIMPLE_FIELDS: [
  FlashcardFieldName.transcription,
  FlashcardFieldName.notes,
  FlashcardFieldName.meaning
] = [
  FlashcardFieldName.transcription,
  FlashcardFieldName.notes,
  FlashcardFieldName.meaning,
]

const TRANSLITERATION_FIELDS: [
  FlashcardFieldName.transcription,
  FlashcardFieldName.notes,
  FlashcardFieldName.meaning,
  FlashcardFieldName.pronunciation
] = [
  FlashcardFieldName.transcription,
  FlashcardFieldName.notes,
  FlashcardFieldName.meaning,
  FlashcardFieldName.pronunciation,
]

export const getNoteTypeFields = (noteType: NoteType) =>
  noteType === 'Transliteration' ? TRANSLITERATION_FIELDS : SIMPLE_FIELDS

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
