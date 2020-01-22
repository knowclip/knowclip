import moment from 'moment'
import { createSelector } from 'reselect'
import { getProjectMediaFiles } from './currentMedia'
import { getSourceSubtitlesFile } from './subtitles'
import getAllTagsFromClips from '../utils/getAllTags'
import { getClips } from './clips'
import { nowUtcTimestamp } from '../utils/sideEffects'

const newestToOldest = (
  { lastOpened: a }: ProjectFile,
  { lastOpened: b }: ProjectFile
) => moment(b).valueOf() - moment(a).valueOf()
export const getProjects = createSelector(
  (state: AppState) => state.files.ProjectFile,
  (projectFiles): Array<ProjectFile> =>
    Object.values(projectFiles).sort(newestToOldest)
)

export const getProjectIdByFilePath = (
  state: AppState,
  filePath: string
): ProjectId | null =>
  Object.keys(state.fileAvailabilities.ProjectFile).find(
    id => state.fileAvailabilities.ProjectFile[id].filePath === filePath
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
    lastOpened: file.lastOpened,
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
          .map(({ id }) => getSourceSubtitlesFile(state, id))
          .filter(
            (file): file is ExternalSubtitlesFile =>
              Boolean(file && file.type === 'ExternalSubtitlesFile')
          ),
      ],
      [] as ExternalSubtitlesFile[]
    ),
  }
}
