// @flow
import uuid from 'uuid/v4'

const convertProject0_0_0___1_0_0 = (project: Project0_0_0): Project1_0_0 => {
  const { clips: oldClips } = project
  const newClips: { [ClipId]: Clip } = {}
  const fileId = uuid()
  for (const clipId in oldClips) {
    const clip = oldClips[clipId]
    const { flashcard } = clip
    newClips[clipId] = {
      id: clip.id,
      start: clip.start,
      end: clip.end,
      flashcard: {
        id: clipId,
        fields: flashcard.fields,
        tags: flashcard.tags || [],
      },
      fileId,
    }
  }

  return {
    version: '1.0.0',
    audioFileName: project.audioFileName,
    noteType: project.noteType,
    clips: newClips,
    audioFileId: fileId,
  }
}
const getProject = (jsonFileContents: string): ?Project1_0_0 => {
  const project: Project = JSON.parse(jsonFileContents)
  switch (project.version) {
    case '0.0.0':
      return convertProject0_0_0___1_0_0(project)
    case '1.0.0':
      return project
    default:
      return null
  }
}

export default getProject
