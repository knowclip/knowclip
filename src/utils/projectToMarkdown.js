// @flow
import * as r from '../redux'
import formatTime from '../utils/formatTime'

const flatten = [(a, b) => a.concat(b), []]

const projectToMarkdown = (
  state: AppState,
  projectId: ProjectId,
  noteType: NoteType
): string => {
  const projectMetadata = r.getProjectMetadata(state, projectId)
  if (!projectMetadata) throw new Error('Could not find project')

  const mediaMetadata = r.getProjectMediaMetadata(state, projectId)

  return ([
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
                ...noteType.fields
                  .map(f => `* ${clip.flashcard.fields[f.id]}`)
                  .map(rawString => rawString.replace(/\n/g, '<br>')),
              ]
            })
            .reduce(...flatten),
        ]
      })
      .reduce(...flatten),
  ]: Array<string>).join('\n')
}

export default projectToMarkdown
