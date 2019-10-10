const SIMPLE_FIELDS: Array<SimpleFlashcardFieldName> = [
  'transcription',
  'notes',
  'meaning',
]

const TRANSLITERATION_FIELDS: Array<TransliterationFlashcardFieldName> = [
  'transcription',
  'notes',
  'meaning',
  'pronunciation',
]

export const getNoteTypeFields = (noteType: NoteType) =>
  noteType === 'Simple' ? SIMPLE_FIELDS : TRANSLITERATION_FIELDS
