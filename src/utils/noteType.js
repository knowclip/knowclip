export const getNoteTypeFields = noteType =>
  noteType === 'Transliteration'
    ? ['transcription', 'pronunciation', 'meaning', 'notes']
    : ['transcription', 'meaning', 'notes']
