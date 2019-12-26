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

      const loadFirstMediaFile = project.mediaFiles.length
        ? [r.openFileRequest(project.mediaFiles[0])]
        : []

      return [
        r.openProject(
          validatedFile,
          project.clips,
          moment()
            .utc()
            .format()
        ),
        ...addNewMediaFiles,
        ...loadFirstMediaFile,
      ]
    },
  ],

  locateRequest: async ({ file }, state, effects) => [
    r.fileSelectionDialog(`Please locate this project file ${file.name}`, file),
  ],

  locateSuccess: null,
  deleteRequest: [],
  deleteSuccess: null,
} as FileEventHandlers<ProjectFile>
