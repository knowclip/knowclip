import getAllTags from '../utils/getAllTags'
import { compose } from 'redux'
import { uuid, nowUtcTimestamp } from '../utils/sideEffects'
import YAML from 'yaml'
import { readFile } from 'fs-extra'
import { getXAtMilliseconds } from '../selectors'
import { blankSimpleFields, blankTransliterationFields } from './newFlashcard'
import { parseFormattedDuration } from './formatTime'

type Result<T> = Failure | Success<T>
type Failure = { errors: string[]; value?: undefined }
type Success<T> = { value: T; errors?: undefined }

export const normalizeProjectData = <F extends FlashcardFields>(
  state: AppState,
  parsedYaml: ProjectYamlDocuments<F>
): NormalizedProjectFileData => {
  //validate here?
  return fillOutSlimProject(state, yamlDocumentsToSlimProject(parsedYaml))
}

export const parseYamlProject = async <F extends FlashcardFields>(
  filePath: string
): Promise<Result<ProjectYamlDocuments<F>>> => {
  try {
    const docs = YAML.parseAllDocuments(await readFile(filePath, 'utf8'))
    const errors = docs.flatMap(v => v.errors)
    if (errors.length) return { errors: errors.map(e => e.message) }

    const [project, ...media] = docs.map(d => d.toJSON())

    return {
      value: {
        project,
        media,
      },
    }
  } catch (err) {
    return { errors: [err.message] }
  }
}

export const yamlDocumentsToSlimProject = <F extends FlashcardFields>({
  project,
  media,
}: ProjectYamlDocuments<F>): SlimProject<F> => ({
  ...project,
  media,
})

export const fillOutSlimProject = <F extends FlashcardFields>(
  state: AppState,
  slimProject: SlimProject<F>
): NormalizedProjectFileData => {
  const project: ProjectFile = {
    id: slimProject.id,
    lastSaved: slimProject.timestamp,
    noteType: slimProject.noteType,
    name: slimProject.name,
    mediaFileIds: slimProject.media.map(m => m.id),
    type: 'ProjectFile',
    error: null,
  }
  const media: [MediaFile, () => Clip[]][] = slimProject.media.map(m => {
    const subtitles = m.subtitles
      ? m.subtitles.map(s => toMediaSubtitlesRelation(s))
      : []
    const base: AudioFile = {
      name: m.name,
      type: 'MediaFile',
      id: m.id,
      parentId: slimProject.id,
      durationSeconds: parseFormattedDuration(m.duration).asSeconds(),
      format: m.format,
      subtitles,
      flashcardFieldsToSubtitlesTracks:
        m.flashcardFieldsToSubtitlesTracks || {},
      subtitlesTracksStreamIndexes: subtitles
        .filter(
          (s): s is EmbeddedSubtitlesTrackRelation =>
            s.type === 'EmbeddedSubtitlesTrack'
        )
        .map(s => s.streamIndex),

      isVideo: false,
    }

    if ('width' in m) {
      return [
        {
          ...base,
          isVideo: true,
          width: m.width,
          height: m.height,
        },
        getMediaClipsGetter<F>(state, project, m),
      ]
    }

    return [base, getMediaClipsGetter<F>(state, project, m)]
  })

  // const subtitles : SubtitlesFile[] = m.subtitles.map(s =>toSubtitlesFile(s, m) )
  let clips: Clip[]

  return {
    project,
    media: media.flatMap(([m]) => m),
    get clips() {
      clips = clips || media.flatMap(([, c]) => c())
      return clips
    },
  }
}

const getMediaClipsGetter = <F extends FlashcardFields>(
  state: AppState,
  project: ProjectFile,
  media: ProjectMediaFile<F>
) => () => getMediaClips(state, project, media)

function getMediaClips<F extends FlashcardFields>(
  state: AppState,
  project: ProjectFile,
  media: ProjectMediaFile<F>
): Clip[] {
  return (media.clips || []).map(
    (c): Clip => {
      const flashcardBase = {
        type: project.noteType,
        id: c.id,
        tags: c.tags || [],
        image: c.image && {
          id: c.id,
          type: 'VideoStillImage' as const,
          ...(c.image.time
            ? { seconds: parseFormattedDuration(c.image.time).asSeconds() }
            : null),
        },
      }
      return {
        id: c.id,
        start: getXAtMilliseconds(
          state,
          parseFormattedDuration(c.start).asMilliseconds()
        ),
        end: getXAtMilliseconds(
          state,
          parseFormattedDuration(c.end).asMilliseconds()
        ),
        fileId: media.id,
        flashcard:
          project.noteType === 'Simple'
            ? {
                ...flashcardBase,
                type: 'Simple',
                fields: { ...blankSimpleFields, ...c.fields },
              }
            : {
                ...flashcardBase,
                type: 'Transliteration',
                fields: { ...blankTransliterationFields, ...c.fields },
              },
      }
    }
  )
}

function toMediaSubtitlesRelation(s: ProjectSubtitles): MediaSubtitlesRelation {
  switch (s.type) {
    case 'Embedded':
      return {
        type: 'EmbeddedSubtitlesTrack',
        id: s.id,
        streamIndex: s.streamIndex,
      }

    case 'External':
      return {
        type: 'ExternalSubtitlesTrack',
        id: s.id,
      }
  }
}
function toSubtitlesFile(
  s: ProjectSubtitles,
  mediaFileId: MediaFileId
): SubtitlesFile {
  switch (s.type) {
    case 'Embedded':
      return {
        type: 'VttConvertedSubtitlesFile',
        id: s.id,
        streamIndex: s.streamIndex,
        parentId: mediaFileId,
        parentType: 'MediaFile',
      }

    case 'External':
      return {
        type: 'ExternalSubtitlesFile',
        name: s.name,
        id: s.id,
        parentId: s.id,
      }
  }
}

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
    timestamp: nowUtcTimestamp(),
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
    timestamp: nowUtcTimestamp(),
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
  lastOpened: nowUtcTimestamp(),
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
