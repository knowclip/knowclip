import * as r from '../redux'
import { FileEventHandlers } from './eventHandlers'
import { of, empty, from, merge } from 'rxjs'
import { map, flatMap } from 'rxjs/operators'
import parseProject from '../utils/parseProject'
import { promises } from 'fs'
import moment from 'moment'

const { readFile } = promises

export default {
  loadRequest: async (fileRecord, filePath, state, effects) => {
    return [
      // TODO: check differences/opened time
      r.loadFileSuccess(fileRecord, filePath),
    ]
  },
  loadSuccess: (fileRecord, filePath, state, effects) => {
    return from(readFile(filePath, 'utf8')).pipe(
      map(projectJson => parseProject(projectJson)),
      flatMap(project => {
        if (!project)
          return of(r.simpleMessageSnackbar('Could not open project'))

        const addNewMediaFiles = from(
          project.mediaFiles
            .filter(
              fileRecord => !r.getFileRecord(state, 'MediaFile', fileRecord.id)
            )
            .map(fileRecord => r.addFile(fileRecord))
        )

        const loadFirstMediaFile = project.mediaFiles.length
          ? of(r.loadFileRequest(project.mediaFiles[0]))
          : empty()

        return merge(
          of(
            r.openProject(
              fileRecord,
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
  loadFailure: null,
  locateRequest: async ({ fileRecord }, state, effects) => [
    r.fileSelectionDialog(
      `Please locate this project file ${fileRecord.name}`,
      fileRecord
    ),
  ],
  locateSuccess: null,
} as FileEventHandlers<ProjectFileRecord>
