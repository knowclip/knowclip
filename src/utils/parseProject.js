import uuid from 'uuid/v4'
import moment from 'moment'
import getAllTags from '../utils/getAllTags'

const convertProject0_0_0___1_0_0 = project => {
  const { clips: oldClips } = project
  const newClips = {}
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
const convertProject1_0_0___2_0_0 = project => {
  const clips = {}
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

const getNoteType = oldProject =>
  oldProject.noteType.fields.length > 3 ? 'Transliteration' : 'Simple'
const getFlashcard = (
  noteType,
  oldFlashcard,
  [noteField1, noteField2, noteField3, ...noteFieldsRest]
) =>
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
const convertProject2_0_0___3_0_0 = project => {
  const noteType = getNoteType(project)
  const clips = {}
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

const parseProject = jsonFileContents => {
  const project = JSON.parse(jsonFileContents)
  switch (project.version) {
    case '0.0.0':
      return convertProject2_0_0___3_0_0(
        convertProject1_0_0___2_0_0(convertProject0_0_0___1_0_0(project))
      )
    case '1.0.0':
      return convertProject2_0_0___3_0_0(convertProject1_0_0___2_0_0(project))
    case '2.0.0':
      return convertProject2_0_0___3_0_0(project)
    case '3.0.0':
      return project
    default:
      return null
  }
}

export default parseProject

export const getMediaFilePaths = (
  originalProjectJson,
  project,
  projectFilePath,
  mediaFilePaths
) => {
  if (
    originalProjectJson &&
    (originalProjectJson.version === '0.0.0' ||
      originalProjectJson.version === '1.0.0')
  ) {
    return [
      {
        metadata: project.mediaFilesMetadata[0],
        filePath: projectFilePath.replace(/\.afca$/, ''),
        constantBitrateFilePath: null,
        error: null,
      },
    ]
  }
  return project.mediaFilesMetadata.map(metadata => {
    const existingMetadataAndFilePath = mediaFilePaths.find(
      ({ metadata: { id }, filePath }) => id === metadata.id
    )
    return {
      metadata,
      constantBitrateFilePath: existingMetadataAndFilePath
        ? existingMetadataAndFilePath.constantBitrateFilePath
        : null,
      filePath: existingMetadataAndFilePath
        ? existingMetadataAndFilePath.filePath
        : null,
      error: null,
    }
  })
}
