import * as r from '../redux'
import formatTime from '../utils/formatTime'

const flatten = [(a, b) => a.concat(b), []]

const projectToMarkdown = (state, projectId, noteType) => {
  const projectMetadata = r.getProjectMetadata(state, projectId)
  if (!projectMetadata) throw new Error('Could not find project')

  const mediaMetadata = r.getProjectMediaMetadata(state, projectId)

  return [
    `# ${projectMetadata.name}`,
    ...mediaMetadata
      .map(metadata => {
        return [
          `\n## ${metadata.name}`,
          ...r
            .getClips(state, metadata.id)
            .map(clip => {
              const clipTime = r.getClipTime(state, clip.id) || {}
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
            .reduce(...flatten),
        ]
      })
      .reduce(...flatten),
  ].join('\n')
}

export default projectToMarkdown
