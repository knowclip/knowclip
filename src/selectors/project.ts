import moment from 'moment'
import { createSelector } from 'reselect'
import { getProjectMediaFiles } from './currentMedia'
import { getSubtitlesSourceFile } from './subtitles'
import getAllTagsFromClips from '../utils/getAllTags'
import { getClips, getClipIdsByMediaFileId, getClip } from './clips'
import { nowUtcTimestamp } from '../utils/sideEffects'
import { getSecondsAtX } from './waveformTime'
// import { normalize, schema } from 'normalizr'

const newestToOldest = (
  { lastOpened: a }: FileAvailability,
  { lastOpened: b }: FileAvailability
): number => {
  if (!a) return 1
  if (!b) return -1
  return moment(b).valueOf() - moment(a).valueOf()
}
export const getProjects = createSelector(
  (state: AppState) => state.files.ProjectFile,
  (state: AppState) => state.fileAvailabilities.ProjectFile,
  (projectFiles, availabilities): Array<ProjectFile> =>
    (Object.values(availabilities) as KnownFile[])
      .sort(newestToOldest)
      .map(({ id }) => projectFiles[id])
      .filter((p): p is ProjectFile => Boolean(p))
)

export const getProjectIdByFilePath = (
  state: AppState,
  filePath: string
): ProjectId | null =>
  Object.keys(state.fileAvailabilities.ProjectFile).find(
    id =>
      (state.fileAvailabilities.ProjectFile[id] as KnownFile).filePath ===
      filePath
  ) || null

export const getProject = (
  state: AppState,
  file: ProjectFile
): Project4_1_0 => {
  const mediaFiles = getProjectMediaFiles(state, file.id)
  return {
    version: '4.1.0',
    timestamp: nowUtcTimestamp(),
    name: file.name,
    id: file.id,
    noteType: file.noteType,
    lastOpened: nowUtcTimestamp(),
    mediaFiles,
    tags: [...getAllTagsFromClips(state.clips.byId)],
    clips: mediaFiles.reduce(
      (clips, { id }) => [...clips, ...getClips(state, id)],
      [] as Clip[]
    ),
    subtitles: mediaFiles.reduce(
      (subtitlesFiles, { id, subtitles }) => [
        ...subtitlesFiles,
        ...subtitles
          .map(({ id }) => getSubtitlesSourceFile(state, id))
          .filter(
            (file): file is ExternalSubtitlesFile =>
              Boolean(file && file.type === 'ExternalSubtitlesFile')
          ),
      ],
      [] as ExternalSubtitlesFile[]
    ),
  }
}

export const getSlimProject = <F extends FlashcardFields>(
  state: AppState,
  file: ProjectFile,
  fieldsTemplate: F
): SlimProject<F> => {
  const mediaFiles = getProjectMediaFiles(state, file.id)
  return {
    name: file.name,
    noteType: file.noteType,
    timestamp: nowUtcTimestamp(),
    id: file.id,

    media: mediaFiles.map(
      (mediaFile): ProjectMediaFile<F> => {
        const { name, format, durationSeconds, subtitles, id } = mediaFile

        return {
          name,
          format,
          durationSeconds,
          id,
          // ...(subtitles.length ? { subtitles } : null),

          clips: getProjectClips(state, mediaFile, fieldsTemplate),
        }
      }
    ),
  }
}
function getProjectClips<F extends FlashcardFields>(
  state: AppState,
  mediaFile: MediaFile,
  fieldsTemplate: F
) {
  const clips = [] as ProjectClip<F>[]
  for (const id of getClipIdsByMediaFileId(state, mediaFile.id)) {
    const clip = getClip(state, id)
    if (clip) {
      const {
        start,
        end,
        flashcard: { fields, tags, image },
      } = clip

      const newClip: ProjectClip<F> = {
        id,
        start: getSecondsAtX(state, start),
        end: getSecondsAtX(state, end),
      }

      const newFields = {}
      Object.keys(fieldsTemplate).reduce(
        (all, fn) => {
          const fieldName: keyof typeof fields = fn as any
          if (fields[fieldName].trim()) all[fieldName] = fields[fieldName]

          return all
        },
        newFields as F
      )
      if (Object.keys(newFields).length) newClip.fields = newFields

      if (tags.length) newClip.tags = tags

      if (image)
        newClip.image = {
          type: 'VideoStill',
          ...(typeof image.seconds === 'number'
            ? { seconds: image.seconds }
            : null),
        }

      clips.push(newClip)
    }
  }

  return clips
}

export const getYamlProject = <F extends FlashcardFields>(
  state: AppState,
  file: ProjectFile,
  fieldsTemplate: F
) => {
  const { name, noteType, timestamp, id, media } = getSlimProject(
    state,
    file,
    fieldsTemplate
  )

  return [{ name, noteType, timestamp, id }, ...media]
}

export const fillOutSlimProject = <F extends FlashcardFields>(
  slimProject: SlimProject<F>
): {
  project: ProjectFile
  media: MediaFile[]
  // clips: Clip[]
  // subtitles: SubtitlesFile[]
} => {
  const project: ProjectFile = {
    id: slimProject.id,
    lastSaved: slimProject.timestamp,
    noteType: slimProject.noteType,
    name: slimProject.name,
    mediaFileIds: slimProject.media.map(m => m.id),
    type: 'ProjectFile',
    error: null,
  }
  const media: MediaFile[] = slimProject.media.map(m => {
    const subtitles = m.subtitles
      ? m.subtitles.map(s => toMediaSubtitlesRelation(s))
      : []
    const base: AudioFile = {
      name: m.name,
      type: 'MediaFile',
      id: m.id,
      parentId: slimProject.id,
      durationSeconds: m.durationSeconds,
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
      return {
        ...base,
        isVideo: true,
        width: m.width,
        height: m.height,
      }
    }

    return base
  })

  // const subtitles : SubtitlesFile[] = m.subtitles.map(s =>toSubtitlesFile(s, m) )

  return { project, media }
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
