import r from '../redux'
import { FileEventHandlers } from './eventHandlers'
import { normalizeProjectJson } from '../utils/normalizeProjectJson'
import { validateMediaFile } from './mediaFile'
import { join, basename } from '../utils/rendererPathHelpers'
import { arrayToMapById } from '../utils/arrayToMapById'
import { FileUpdateName } from './FileUpdateName'

const projectFileEventHandlers: FileEventHandlers<ProjectFile> = {
  openRequest: async (file, filePath, state, effects) => {
    try {
      const parse = await effects.parseProjectJson(filePath)
      if (parse.error) throw parse.error

      const { project, clips, cards } = normalizeProjectJson(state, parse.value)
      if (!project)
        return [
          r.openFileFailure(
            file,
            filePath,
            'Could not read project file. Please make sure your software is up to date and try again.'
          ),
        ]

      if (project.id !== file.id)
        return [
          r.openFileFailure(
            file,
            filePath,
            `This project file has a different ID than the "${file.name}" on record.`
          ),
        ]

      effects.sendToMainProcess({
        type: 'setAppMenuProjectSubmenuPermissions',
        args: [true],
      })

      return [
        r.openProject(
          file,
          clips,
          effects.nowUtcTimestamp(),
          arrayToMapById(cards)
        ),

        r.openFileSuccess(project, filePath, effects.nowUtcTimestamp()),
      ]
    } catch (err) {
      console.error(err)
      return [
        r.openFileFailure(file, filePath, `Error opening project file: ${err}`),
      ]
    }
  },
  openSuccess: [
    async (_validatedFile, filePath, state, effects) => {
      const parse = await effects.parseProjectJson(filePath)
      if (parse.error) throw parse.error

      const { project, media, subtitles } = normalizeProjectJson(
        state,
        parse.value
      )

      if (!project) return [r.simpleMessageSnackbar('Could not open project')]

      // TODO: trigger this in media menu items + export tables instead
      const newlyAutoFoundMediaFilePaths: {
        [id: string]: string | undefined
      } = {}

      const { platform } = window.electronApi
      for (const mediaFile of media.filter(
        (m) => !(r.getFileAvailability(state, m) || { filePath: null }).filePath
      )) {
        // works while fileavailability names can't be changed...
        for (const directory of r.getAssetsDirectories(state)) {
          const nameMatch = join(
            platform,
            directory,
            basename(platform, mediaFile.name)
          )
          const matchingFile = (await effects.fileExists(nameMatch)).value
            ? await validateMediaFile(mediaFile, nameMatch, effects)
            : null

          if (matchingFile && !matchingFile.error && matchingFile.value)
            newlyAutoFoundMediaFilePaths[mediaFile.id] = nameMatch
        }
      }

      const newlyAutoFoundSubtitlesPaths: {
        [id: string]:
          | { singleMatch: string }
          | { multipleMatches: true; singleMatch: undefined }
          | undefined
      } = {}
      for (const subtitlesFile of subtitles.filter(
        (s) => !(r.getFileAvailability(state, s) || { filePath: null }).filePath
      )) {
        if (subtitlesFile.type !== 'ExternalSubtitlesFile') continue
        // works while subtitles files names can't be changed...
        for (const directory of r.getAssetsDirectories(state)) {
          const nameMatch = join(
            platform,
            directory,
            basename(platform, subtitlesFile.name)
          )
          const fileExistsResult = await effects.fileExists(nameMatch)
          if (fileExistsResult.error) {
            console.error(fileExistsResult.error)
          }

          const validationResult = fileExistsResult.value
            ? await effects.validateSubtitlesFromFilePath(
                nameMatch,
                subtitlesFile
              )
            : null
          if (!validationResult?.value?.differences)
            newlyAutoFoundSubtitlesPaths[subtitlesFile.id] =
              newlyAutoFoundSubtitlesPaths[subtitlesFile.id]
                ? { multipleMatches: true, singleMatch: undefined }
                : { singleMatch: nameMatch }
        }
      }

      const addNewMediaFiles = media
        .filter((mediaFile) => !r.getFile(state, 'MediaFile', mediaFile.id))
        .map((mediaFile) => {
          return r.addFile(
            mediaFile,
            newlyAutoFoundMediaFilePaths[mediaFile.id]
          )
        })
      const addNewSubtitlesFiles = subtitles
        .filter(
          (subtitlesFile) => !r.getSubtitlesSourceFile(state, subtitlesFile.id)
        )
        .map((subtitlesFile) => {
          const existingPath = newlyAutoFoundSubtitlesPaths[subtitlesFile.id]
          return r.addFile(
            subtitlesFile,
            existingPath ? existingPath.singleMatch : undefined
          )
        })

      const loadLastMediaFile = media.length
        ? [r.openFileRequest(media[media.length - 1])]
        : []

      return [
        ...addNewMediaFiles,
        ...addNewSubtitlesFiles,
        ...loadLastMediaFile,
      ]
    },
  ],

  openFailure: async (_file, _filePath, errorMessage) => [
    r.errorDialog('Problem opening project file:', errorMessage || ''),
  ],

  locateRequest: async (file, _availability, _state, _effects) => [
    r.fileSelectionDialog(
      `Please locate this project file "${file.name}"`,
      file
    ),
  ],

  locateSuccess: async (_action, _state) => [],
  deleteRequest: [
    async (_file, availability, descendants, _state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [
    async (action, _state) => [
      r.commitFileDeletions('ProjectFile'),
      ...Array.from(new Set(action.descendants.map((a) => a.type))).map(
        (type) => r.commitFileDeletions(type)
      ),
    ],
  ],
}

export default projectFileEventHandlers

export const updates = {
  [FileUpdateName.SetProjectName]: (file, name: string) => {
    return {
      ...file,
      name,
    }
  },
  [FileUpdateName.DeleteProjectMedia]: (file, mediaFileId: string) => ({
    ...file,
    mediaFileIds: file.mediaFileIds.filter((id) => id !== mediaFileId),
  }),
} satisfies FileUpdatesForFileType<ProjectFile>
