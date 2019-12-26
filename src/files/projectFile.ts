import * as r from '../redux'
import { FileEventHandlers } from './eventHandlers'
import { of, empty, from, merge } from 'rxjs'
import { map, flatMap } from 'rxjs/operators'
import parseProject from '../utils/parseProject'
import { promises } from 'fs'
import moment from 'moment'

const { readFile } = promises

export default {
  openRequest: async (file, filePath, state, effects) => {
    return [
      // TODO: check differences/opened time
      r.openFileSuccess(file, filePath),
    ]
  },
  openSuccess: (file, filePath, state, effects) => {
    return from(readFile(filePath, 'utf8')).pipe(
      map(projectJson => parseProject(projectJson)),
      flatMap(project => {
        if (!project)
          return of(r.simpleMessageSnackbar('Could not open project'))

        const addNewMediaFiles = from(
          project.mediaFiles
            .filter(file => !r.getFile(state, 'MediaFile', file.id))
            .map(file => r.addFile(file))
        )

        const loadFirstMediaFile = project.mediaFiles.length
          ? of(r.openFileRequest(project.mediaFiles[0]))
          : empty()

        return merge(
          of(
            r.openProject(
              file,
              project.clips,
              moment()
                .utc()
                .format()
            )
          ),
          addNewMediaFiles,
          loadFirstMediaFile
        )
      })
    )
  },
  openFailure: null,
  locateRequest: async ({ file }, state, effects) => [
    r.fileSelectionDialog(`Please locate this project file ${file.name}`, file),
  ],
  locateSuccess: null,
} as FileEventHandlers<ProjectFile>
