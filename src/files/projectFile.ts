import * as r from '../redux'
import { FileEventHandlers } from './eventHandlers'
import { parseProjectJson, normalizeProjectJson } from '../utils/parseProject'

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

      const { project, media } = normalizeProjectJson(state, parse.value)

      if (!project) return [r.simpleMessageSnackbar('Could not open project')]

      const addNewMediaFiles = media
        .filter(
          validatedFile => !r.getFile(state, 'MediaFile', validatedFile.id)
        )
        .map(validatedFile => r.addFile(validatedFile))

      const loadFirstMediaFile = media.length
        ? [r.openFileRequest(media[0])]
        : []

      return [
        ...addNewMediaFiles,
        ...loadFirstMediaFile,
        ...persistFiles(state, effects.setLocalStorage),
      ]
    },
  ],

  openFailure: async ({ file, filePath, errorMessage }) => [
    r.errorDialog('Problem opening project file:', errorMessage),
  ],

  locateRequest: async ({ file }, state, effects) => [
    r.fileSelectionDialog(
      `Please locate this project file "${file.name}"`,
      file
    ),
  ],

  locateSuccess: async (action, state, { setLocalStorage }) =>
    persistFiles(state, setLocalStorage),
  deleteRequest: [
    async (file, availability, descendants, state) => [
      r.deleteFileSuccess(availability, descendants),
    ],
  ],
  deleteSuccess: [
    async (action, state, { setLocalStorage }) =>
      persistFiles(state, setLocalStorage),
    async (action, state) => [r.commitFileDeletions()],
  ],
} as FileEventHandlers<ProjectFile>

function persistFiles(
  state: AppState,
  setLocalStorage: (arg0: string, arg1: string) => void
) {
  setLocalStorage('files', JSON.stringify(state.files))
  setLocalStorage(
    'fileAvailabilities',
    JSON.stringify(state.fileAvailabilities)
  )
  return []
}
