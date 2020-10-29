import r from '../redux'
import formatTime from '../utils/formatTime'

const projectToMarkdown = (
  state: AppState,
  projectId: ProjectId,
  noteType: NoteType,
  mediaFileIdsToClipIds: Record<MediaFileId, Array<ClipId | undefined>>
): string => {
  const projectMetadata = r.getFile<ProjectFile>(
    state,
    'ProjectFile',
    projectId
  )
  if (!projectMetadata) throw new Error('Could not find project')

  const media = Object.keys(mediaFileIdsToClipIds)

  return [
    `# ${projectMetadata.name}`,
    ...media.flatMap((id) => {
      const metadata = r.getFile<MediaFile>(state, 'MediaFile', id)
      if (!metadata) throw new Error('Could not find media file')

      const clips = mediaFileIdsToClipIds[id]
        ? mediaFileIdsToClipIds[id].filter((c): c is string =>
            Boolean(c && c.trim())
          )
        : []
      if (!clips.length) return []

      return [
        `\n## ${metadata.name}`,
        ...clips.flatMap((clipId) => {
          const clip = r.getClip(state, clipId)
          const flashcard = r.getFlashcard(state, clipId)

          if (!(clip && flashcard))
            throw new Error('Could not find clip/flashcard')

          const clipTime = r.getClipTime(state, flashcard.id)
          return [
            clipTime
              ? `\n**${formatTime(clipTime.start)} - ${formatTime(
                  clipTime.end
                )}** ${flashcard.tags.map((tag) => `_#${tag}_`).join(' ')}`
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
            ).map((rawString) => rawString.replace(/[\n\r]/g, '<br>')),
          ]
        }),
      ]
    }),
  ].join('\n')
}

export default projectToMarkdown
