import YAML from 'yaml'
import { readFile } from 'fs-extra'
import { getXAtMilliseconds, getProjectJson } from '../selectors'
import { blankSimpleFields, blankTransliterationFields } from './newFlashcard'
import { parseFormattedDuration } from './formatTime'
import { ProjectJson, MediaJson, SubtitlesJson } from '../types/Project'
import validateProject from './validateProject'

type Result<T> = Failure | Success<T>
type Failure = { errors: string[]; value?: undefined }
type Success<T> = { value: T; errors?: undefined }

type NormalizedProjectFileData = {
  project: ProjectFile
  media: MediaFile[]
  clips: Clip[]
  subtitles: SubtitlesFile[]
}

export const parseProjectJson = async <F extends FlashcardFields>(
  filePath: string
): Promise<Result<ProjectJson<F>>> => {
  try {
    const docs = YAML.parseAllDocuments(await readFile(filePath, 'utf8'))
    const errors = docs.flatMap(v => v.errors)
    if (errors.length) return { errors: errors.map(e => e.message) }

    const [project, ...media] = docs.map(d => d.toJSON())

    const validation = validateProject(project, media)

    if (validation.errors)
      return {
        errors: Object.entries(validation.errors).map(
          ([sectionName, bigErrorMessage]) => {
            return `Invalid data for ${sectionName}:\n\n${bigErrorMessage}`
          }
        ),
      }

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

export const normalizeProjectJson = <F extends FlashcardFields>(
  state: AppState,
  { project: projectJson, media: mediaJson }: ProjectJson<F>
): NormalizedProjectFileData => {
  const project: ProjectFile = {
    id: projectJson.id,
    lastSaved: projectJson.timestamp,
    noteType: projectJson.noteType,
    name: projectJson.name,
    mediaFileIds: mediaJson.map(m => m.id),
    type: 'ProjectFile',
    error: null,
  }
  const media: [MediaFile, () => Clip[], SubtitlesFile[]][] = mediaJson.map(
    m => {
      const subtitles = m.subtitles
        ? m.subtitles.map(s => toMediaSubtitlesRelation(s))
        : []
      const subtitlesFiles: SubtitlesFile[] = (m.subtitles || []).map(s =>
        s.type === 'Embedded'
          ? {
              type: 'VttConvertedSubtitlesFile',
              id: s.id,
              streamIndex: s.streamIndex,
              parentId: m.id,
              parentType: 'MediaFile',
            }
          : {
              type: 'ExternalSubtitlesFile',
              id: s.id,
              name: s.name,
              parentId: m.id,
              parentType: 'MediaFiles',
            }
      )
      const base: AudioFile = {
        name: m.name,
        type: 'MediaFile',
        id: m.id,
        parentId: projectJson.id,
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
          subtitlesFiles,
        ]
      }

      return [base, getMediaClipsGetter<F>(state, project, m), subtitlesFiles]
    }
  )

  let clips: Clip[]

  return {
    project,
    media: media.flatMap(([m]) => m),
    get clips() {
      clips = clips || media.flatMap(([, c]) => c())
      return clips
    },
    subtitles: media.flatMap(([, , s]) => s),
  }
}

const getMediaClipsGetter = <F extends FlashcardFields>(
  state: AppState,
  project: ProjectFile,
  media: MediaJson<F>
) => () => getMediaClips(state, project, media)

function getMediaClips<F extends FlashcardFields>(
  state: AppState,
  project: ProjectFile,
  media: MediaJson<F>
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

function toMediaSubtitlesRelation(s: SubtitlesJson): MediaSubtitlesRelation {
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
