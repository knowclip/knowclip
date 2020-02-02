import moment from 'moment'
import { createSelector } from 'reselect'
import { getProjectMediaFiles } from './currentMedia'
import { getSubtitlesSourceFile } from './subtitles'
import getAllTagsFromClips from '../utils/getAllTags'
import { getClips, getClipIdsByMediaFileId, getClip } from './clips'
import { nowUtcTimestamp } from '../utils/sideEffects'
import { getSecondsAtX } from './waveformTime'
import { formatDurationWithMilliseconds } from '../utils/formatTime'
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
    Object.entries(availabilities)
      .map(
        ([id, availability]): FileAvailability =>
          availability ||
          console.log(id, projectFiles[id]) || {
            id,
            filePath: null,
            status: 'NOT_FOUND',
            isLoading: false,
            lastOpened: null,
          }
      )
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
        const { name, format, durationSeconds, id } = mediaFile

        const subtitles: ProjectSubtitles[] = mediaFile.subtitles.map(s =>
          s.type === 'EmbeddedSubtitlesTrack'
            ? {
                id: s.id,
                streamIndex: s.streamIndex,
                type: 'Embedded',
              }
            : {
                id: s.id,
                type: 'External',
                name: (
                  (getSubtitlesSourceFile(
                    state,
                    s.id
                  ) as ExternalSubtitlesFile | null) || {
                    name: 'External subtitles file',
                  }
                ).name,
              }
        )

        const clips = getProjectClips(state, mediaFile, fieldsTemplate)

        const newMediaFile: ProjectMediaFile<F> = {
          name,
          format,
          duration: formatDurationWithMilliseconds(
            moment.duration({
              seconds: durationSeconds,
            })
          ),
          id,
        }

        if (subtitles.length) newMediaFile.subtitles = subtitles
        if (clips.length) newMediaFile.clips = clips
        if (mediaFile.flashcardFieldsToSubtitlesTracks)
          newMediaFile.flashcardFieldsToSubtitlesTracks =
            mediaFile.flashcardFieldsToSubtitlesTracks

        return newMediaFile
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
        start: formatDurationWithMilliseconds(
          moment.duration({
            seconds: getSecondsAtX(state, start),
          })
        ),
        end: formatDurationWithMilliseconds(
          moment.duration({
            seconds: getSecondsAtX(state, end),
          })
        ),
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
): ProjectYamlDocuments<F> => {
  const { name, noteType, timestamp, id, media } = getSlimProject(
    state,
    file,
    fieldsTemplate
  )

  return { project: { name, noteType, timestamp, id }, media }
}
