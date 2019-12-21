import * as r from '../redux'
import formatTime from '../utils/formatTime'

const projectToMarkdown = (
  state: AppState,
  projectId: ProjectId,
  noteType: NoteType
): string => {
  const projectMetadata = r.getFileRecord<ProjectFileRecord>(
    state,
    'ProjectFile',
    projectId
  )
  if (!projectMetadata) throw new Error('Could not find project')

  const media = r.getProjectMediaFileRecords(state, projectId)

  return [
    `# ${projectMetadata.name}`,
    ...media
      .map(metadata => {
        return [
          `\n## ${metadata.name}`,
          ...r
            .getClips(state, metadata.id)
            .map(clip => {
              const clipTime = r.getClipTime(state, clip.id)
              return [
                clipTime
                  ? `\n**${formatTime(clipTime.start)} - ${formatTime(
                      clipTime.end
                    )}** ${clip.flashcard.tags
                      .map(tag => `_#${tag}_`)
                      .join(' ')}`
                  : '',
                ...(clip.flashcard.type === 'Simple'
                  ? [
                      `* ${clip.flashcard.fields.transcription}`,
                      `* ${clip.flashcard.fields.meaning}`,
                      `* ${clip.flashcard.fields.notes}`,
                    ]
                  : [
                      `* ${clip.flashcard.fields.transcription}`,
                      `* ${clip.flashcard.fields.pronunciation}`,
                      `* ${clip.flashcard.fields.meaning}`,
                      `* ${clip.flashcard.fields.notes}`,
                    ]
                ).map(rawString => rawString.replace(/\n/g, '<br>')),
              ]
            })
            .reduce((a, b) => a.concat(b), []),
        ]
      })
      .reduce((a, b) => a.concat(b), []),
  ].join('\n')
}

export default projectToMarkdown
