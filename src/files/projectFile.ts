import * as r from '../redux'
import { FileEventHandlers } from './eventHandlers'
import { parseProjectJson, normalizeProjectJson } from '../utils/parseProject'
import { join, basename } from 'path'
import { existsSync } from 'fs-extra'
import { validateMediaFile } from './mediaFile'
import { AsyncError } from '../utils/ffmpeg'

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    try {
      const parse = await parseProjectJson(filePath)
      if (parse.errors) throw new Error(parse.errors.join('; '))

      const { project, clips } = normalizeProjectJson(state, parse.value)
      if (!project)
        return [
          r.openFileFailure(
            file,
            filePath,
            'Could not read project file. Please make sure your software is up to date and try again.'
          ),
        ]

      return [
        r.openProject(file, clips, effects.nowUtcTimestamp()),

        r.openFileSuccess(project, filePath),
      ]
    } catch (err) {
      console.error(err)
      return [
        r.openFileFailure(
          file,
          filePath,
          `Error opening project file: ${err.message}`
        ),
      ]
    }
  },
  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      const parse = await parseProjectJson(filePath)
      if (parse.errors) throw new Error(parse.errors.join('; '))

      const { project, media, subtitles } = normalizeProjectJson(
        state,
        parse.value
      )

      if (!project) return [r.simpleMessageSnackbar('Could not open project')]

      // TODO: trigger this in media menu items + export tables instead
      const newlyAutoFoundMediaFilePaths: {
        [id: string]: string | undefined
      } = {}

      for (const mediaFile of media.filter(
        m => !(r.getFileAvailability(state, m) || { filePath: null }).filePath
      )) {
        // works while fileavailability names can't be changed...
        for (const directory of r.getAssetsDirectories(state)) {
          const nameMatch = join(directory, basename(mediaFile.name))
          const matchingFile =
            existsSync(nameMatch) &&
            (await validateMediaFile(mediaFile, nameMatch))

          if (matchingFile && !(matchingFile instanceof AsyncError))
            newlyAutoFoundMediaFilePaths[mediaFile.id] = nameMatch
        }
      }

      const addNewMediaFiles = media
        .filter(
          validatedFile => !r.getFile(state, 'MediaFile', validatedFile.id)
        )
        .map(validatedFile => {
          return r.addFile(
            validatedFile,
            newlyAutoFoundMediaFilePaths[validatedFile.id]
          )
        })
      const addNewSubtitlesFiles = subtitles
        .filter(
          validatedFile => !r.getSubtitlesSourceFile(state, validatedFile.id)
        )
        .map(validatedFile => r.addFile(validatedFile))

      const loadFirstMediaFile = media.length
        ? [r.openFileRequest(media[0])]
        : []

      return [
        ...addNewMediaFiles,
        ...addNewSubtitlesFiles,
        ...loadFirstMediaFile,
      ]
    },
  ],

  openFailure: async ({ file, filePath, errorMessage }) => [
    r.errorDialog('Problem opening project file:', errorMessage),
  ],

  locateRequest: async ({ file }, availability, state, effects) => [
    r.fileSelectionDialog(
      `Please locate this project file "${file.name}"`,
      file
    ),
  ],

  locateSuccess: async (action, state) => [],
  deleteRequest: [
    async (file, availability, descendants, state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [async (action, state) => [r.commitFileDeletions()]],
} as FileEventHandlers<ProjectFile>
