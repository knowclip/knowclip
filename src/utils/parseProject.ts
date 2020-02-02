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
