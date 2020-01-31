import * as r from '../redux'
import { FileEventHandlers } from './eventHandlers'
import parseProject from '../utils/parseProject'
import { promises } from 'fs'

const { readFile } = promises

export default {
  openRequest: async ({ file }, filePath, state, effects) => {
    try {
      const projectJson = ((await readFile(filePath)) as unknown) as string
      const project = parseProject(projectJson)
      if (!project)
        return [
          r.openFileFailure(
            file,
            filePath,
            'Could not read project file. Please make sure your software is up to date and try again.'
          ),
        ]

      const mediaFiles = project.mediaFiles.map(({ id }) => id)
      const projectFile: ProjectFile = {
        id: project.id,
        type: 'ProjectFile',
        lastSaved: project.timestamp,
        name: project.name,
        mediaFileIds: mediaFiles,
        error: null,
        noteType: project.noteType,
      }
      return [
        r.openProject(file, project.clips, effects.nowUtcTimestamp()),

        r.openFileSuccess(projectFile, filePath),
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
      const projectJson = await readFile(filePath, 'utf8')
      const project = parseProject(projectJson)

      if (!project) return [r.simpleMessageSnackbar('Could not open project')]

      const addNewMediaFiles = project.mediaFiles
        .filter(
          validatedFile => !r.getFile(state, 'MediaFile', validatedFile.id)
        )
        .map(validatedFile => r.addFile(validatedFile))

      // is this bit even necessary?
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
        // maybe should happen when opening media
        // OR actually probably better in useEffect in components that need the data
        // ...addNewSubtitlesFiles,
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
