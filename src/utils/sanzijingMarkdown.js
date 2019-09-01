// @flow
import * as r from '../redux'

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
    ...mediaMetadata
      .map(metadata => {
        return [
          ...r.getClips(state, metadata.id).map((clip, i, clips) => {
            const { fields } = clip.flashcard
            if (!fields.pronunciation)
              throw new Error('Pronunciation field missing')
            return [
              ...(!clips[i - 1] ||
              clips[i - 1].flashcard.tags.sort().toString() !==
                clip.flashcard.tags.sort().toString()
                ? [`# ${clip.flashcard.tags.join(' ')}`]
                : []),
              `## 三字經 ${i}`,
              fields.pronunciation.replace('/\n/g', '  \n'),
              fields.transcription.replace('/\n/g', '  \n'),
              fields.meaning.replace('/\n/g', '  \n'),
              ...(fields.notes
                ? ['> ' + fields.notes.replace(/\n/g, '  \n> ')]
                : []),
              '',
            ].join('\n\n')
          }),
        ]
      })
      .reduce(...flatten),
  ]: Array<string>).join('\n')
}

export default projectToMarkdown
