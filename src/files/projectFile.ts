import * as r from '../redux'
import { FileEventHandlers } from './eventHandlers'
import parseProject from '../utils/parseProject'
import { promises } from 'fs'
import moment from 'moment'

const { readFile } = promises

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    return [
      // TODO: check differences/opened time
      r.openFileSuccess(file, filePath),
    ]
  },
  openSuccess: [
    async ({ validatedFile, filePath }, state, effects) => {
      const projectJson = await readFile(filePath, 'utf8')
      const project = parseProject(projectJson)

      if (!project) return [r.simpleMessageSnackbar('Could not open project')]

      const addNewMediaFiles = project.mediaFiles
        .filter(
          validatedFile => !r.getFile(state, 'MediaFile', validatedFile.id)
        )
        .map(validatedFile => r.addFile(validatedFile))
      console.log('subbies', project.subtitles)
      const addNewSubtitlesFiles = project.subtitles
        .filter(
          subtitlesFile =>
            !r.getFile(state, subtitlesFile.type, subtitlesFile.id)
        )
        .map(file => r.addFile(file))

      const loadFirstMediaFile = project.mediaFiles.length
        ? [r.openFileRequest(project.mediaFiles[0])]
        : []

      return [
        ...addNewMediaFiles,
        ...addNewSubtitlesFiles, // maybe should happen when opening media
        r.openProject(
          validatedFile,
          project.clips,
          moment()
            .utc()
            .format()
        ),
        ...loadFirstMediaFile,
        ...persistFiles(state, effects.setLocalStorage),
      ]
    },
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
    async (file, descendants, state, effects) => [
      r.deleteFileSuccess(file, descendants),
    ],
  ],
  deleteSuccess: [
    async (action, state, { setLocalStorage }) =>
      persistFiles(state, setLocalStorage),
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
