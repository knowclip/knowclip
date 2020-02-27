import * as r from '../redux'
import formatTime from '../utils/formatTime'

const projectToMarkdown = (
  state: AppState,
  projectId: ProjectId,
  noteType: NoteType
): string => {
  const projectMetadata = r.getFile<ProjectFile>(
    state,
    'ProjectFile',
    projectId
  )
  if (!projectMetadata) throw new Error('Could not find project')

  const media = r.getProjectMediaFiles(state, projectId)

  return [
    `# ${projectMetadata.name}`,
    ...media
      .map(metadata => {
        return [
          `\n## ${metadata.name}`,
          ...r
            .getFlashcards(state, metadata.id)
            .map(flashcard => {
              const clipTime = r.getClipTime(state, flashcard.id)
              return [
                clipTime
                  ? `\n**${formatTime(clipTime.start)} - ${formatTime(
                      clipTime.end
                    )}** ${flashcard.tags.map(tag => `_#${tag}_`).join(' ')}`
                  : '',
                ...(flashcard.type === 'Simple'
                  ? [
                      `* ${flashcard.fields.transcription}`,
                      `* ${flashcard.fields.meaning}`,
                      `* ${flashcard.fields.notes}`,
                    ]
                  : [
                      `* ${flashcard.fields.transcription}`,
                      `* ${flashcard.fields.pronunciation}`,
                      `* ${flashcard.fields.meaning}`,
                      `* ${flashcard.fields.notes}`,
                    ]
                ).map(rawString => rawString.replace(/[\n\r]/g, '<br>')),
              ]
            })
            .reduce((a, b) => a.concat(b), []),
        ]
      })
      .reduce((a, b) => a.concat(b), []),
  ].join('\n')
}

export default projectToMarkdown
