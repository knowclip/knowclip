import uuid from 'uuid/v4'
import moment from 'moment'
import getAllTags from '../utils/getAllTags'
import { compose } from 'redux'

const convertProject0_0_0___1_0_0 = (project: Project0_0_0): Project1_0_0 => {
  const { clips: oldClips } = project
  const newClips: { [clipId: string]: ClipPre3_0_0 } = {}
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
const convertProject1_0_0___2_0_0 = (project: Project1_0_0): Project2_0_0 => {
  const clips: { [clipId: string]: ClipPre3_0_0 } = {}
  for (const clipId in project.clips) {
    const clip = project.clips[clipId]
    clips[clipId] = {
      ...clip,
      start: +clip.start.toFixed(2),
      end: +clip.end.toFixed(2),
    }
  }
  return {
    version: '2.0.0',
    id: uuid(),
    timestamp: moment.utc().format(),
    name: `Clips from ${project.audioFileName}`,
    // @ts-ignore
    tags: [...getAllTags(project.clips)],
    mediaFilesMetadata: [
      {
        id: project.audioFileId,
        durationSeconds: 0,
        format: 'UNKNOWN',
        name: project.audioFileName,
        isVideo: false, // can't know yet
      },
    ],
    noteType: project.noteType,
    clips,
  }
}

const getNoteType = (oldProject: Project0_0_0 | Project1_0_0 | Project2_0_0) =>
  oldProject.noteType.fields.length > 3 ? 'Transliteration' : 'Simple'
const getFlashcard = (
  noteType: NoteType,
  oldFlashcard: FlashcardPre3_0_0,
  [noteField1, noteField2, noteField3, ...noteFieldsRest]: Array<{ id: string }>
): Flashcard =>
  noteType === 'Simple'
    ? {
        id: oldFlashcard.id,
        tags: oldFlashcard.tags,
        type: 'Simple',
        fields: {
          transcription: oldFlashcard.fields[noteField1.id],
          meaning: noteField2 ? oldFlashcard.fields[noteField2.id] : '',
          notes: noteField3 ? oldFlashcard.fields[noteField3.id] : '',
        },
      }
    : {
        id: oldFlashcard.id,
        tags: oldFlashcard.tags,
        type: 'Transliteration',
        fields: {
          transcription: oldFlashcard.fields[noteField1.id],
          pronunciation: noteField2 ? oldFlashcard.fields[noteField2.id] : '',
          meaning: noteField3 ? oldFlashcard.fields[noteField3.id] : '',
          notes: noteFieldsRest
            .map(({ id }) => oldFlashcard.fields[id])
            .join('\n\n'),
        },
      }
const convertProject2_0_0___3_0_0 = (project: Project2_0_0): Project3_0_0 => {
  const noteType = getNoteType(project)
  const clips: Record<ClipId, Clip> = {}
  for (const clipId in project.clips) {
    const clip = project.clips[clipId]
    clips[clipId] = {
      id: clip.id,
      fileId: clip.fileId,
      start: clip.start,
      end: clip.end,
      flashcard: getFlashcard(
        noteType,
        clip.flashcard,
        project.noteType.fields
      ),
    }
  }
  return {
    version: '3.0.0',
    id: uuid(),
    noteType,
    timestamp: moment.utc().format(),
    name: project.name,
    tags: project.tags,
    mediaFilesMetadata: project.mediaFilesMetadata,
    clips,
  }
}
const convertProject3_0_0___4_0_0 = (project: Project3_0_0): Project4_0_0 => ({
  ...project,
  version: '4.0.0',
  clips: Object.values(project.clips),
  mediaFilesMetadata: project.mediaFilesMetadata.map(metadata => ({
    ...metadata,
    subtitlesTracksStreamIndexes: [],
  })),
})

const convertProject4_0_0___4_1_0 = (project: Project4_0_0): Project4_1_0 => ({
  ...project,
  version: '4.1.0',
  clips: Object.values(project.clips),
  mediaFiles: project.mediaFilesMetadata.map(metadata => ({
    id: metadata.id,
    type: 'MediaFile',
    parentId: project.id,
    name: metadata.name,
    durationSeconds: metadata.durationSeconds,
    isVideo: metadata.isVideo,
    format: metadata.format,
    flashcardFieldsToSubtitlesTracks: {},
    subtitles: [],
    subtitlesTracksStreamIndexes: [],
  })),
  subtitles: [],
  lastOpened: moment()
    .utc()
    .format(),
})

const parseProject = (jsonFileContents: string) => {
  const project = JSON.parse(jsonFileContents) as Project
  switch (project.version) {
    case '0.0.0':
      return compose<Project4_1_0>(
        convertProject4_0_0___4_1_0,
        convertProject3_0_0___4_0_0,
        convertProject2_0_0___3_0_0,
        convertProject1_0_0___2_0_0,
        convertProject0_0_0___1_0_0
      )(project)
    case '1.0.0':
      return compose<Project4_1_0>(
        convertProject4_0_0___4_1_0,
        convertProject3_0_0___4_0_0,
        convertProject2_0_0___3_0_0,
        convertProject1_0_0___2_0_0
      )(project)
    case '2.0.0':
      return compose<Project4_1_0>(
        convertProject4_0_0___4_1_0,
        convertProject3_0_0___4_0_0,
        convertProject2_0_0___3_0_0
      )(project)
    case '3.0.0':
      return compose<Project4_1_0>(
        convertProject4_0_0___4_1_0,
        convertProject3_0_0___4_0_0
      )(project)
    case '4.0.0':
      return compose<Project4_1_0>(convertProject4_0_0___4_1_0)(project)
    case '4.1.0':
      return project
    default:
      return null
  }
}

export default parseProject
