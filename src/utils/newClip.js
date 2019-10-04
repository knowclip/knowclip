const ascending = (a, b) => a - b

const sortClipPoints = ({ start, end }) => [start, end].sort(ascending)

const newClip = (pendingClip, fileId, id, noteType, tags = [], fields) => {
  const [start, end] = sortClipPoints(pendingClip)

  const { transcription = '', pronunciation = '', meaning = '', notes = '' } =
    fields || {}

  return {
    start: +start.toFixed(2),
    end: +end.toFixed(2),
    id,
    fileId,
    flashcard:
      noteType === 'Simple'
        ? {
            id,
            tags,
            type: 'Simple',
            fields: {
              transcription,
              meaning,
              notes,
            },
          }
        : {
            id,
            tags,
            type: 'Transliteration',
            fields: {
              transcription,
              pronunciation,
              meaning,
              notes,
            },
          },
  }
}

export default newClip
