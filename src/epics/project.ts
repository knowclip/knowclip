import {
  flatMap,
  map,
  filter,
  mergeAll,
  switchMap,
  catchError,
} from 'rxjs/operators'
import { of, from, empty } from 'rxjs'
import { ofType, combineEpics } from 'redux-observable'
import * as A from '../types/ActionType'
import * as r from '../redux'
import { promisify } from 'util'
import fs, { existsSync } from 'fs'
import { parseProjectJson, normalizeProjectJson } from '../utils/parseProject'
import './setYamlOptions'

const writeFile = promisify(fs.writeFile)

const createProject: AppEpic = (action$, state$) =>
  action$.ofType<CreateProject>(A.CREATE_PROJECT).pipe(
    switchMap(({ project, filePath }) => {
      return from(
        writeFile(filePath, r.getProjectFileContents(state$.value, project))
      ).pipe(
        flatMap(() =>
          from([
            r.openFileRequest(project, filePath),
            r.setWorkIsUnsaved(false),
          ])
        )
      )
    }),
    catchError(err =>
      of(
        r.simpleMessageSnackbar(
          'Error creating project file: ' + err.toString()
        )
      )
    )
  )

const openProjectById: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, OpenProjectRequestById>(A.OPEN_PROJECT_REQUEST_BY_ID),
    map(({ id }) => {
      const project = r.getFileAvailabilityById<ProjectFile>(
        state$.value,
        'ProjectFile',
        id
      )
      if (!project.filePath || !existsSync(project.filePath)) {
        const projectFile = r.getFile<ProjectFile>(
          state$.value,
          'ProjectFile',
          id
        )

        return projectFile
          ? r.locateFileRequest(
              projectFile,
              'This project was either moved or renamed.'
            )
          : r.simpleMessageSnackbar(`Could not open project.`)
      }
      return r.openProjectByFilePath(project.filePath)
    })
  )

const openProjectByFilePath: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, OpenProjectRequestByFilePath>(
      A.OPEN_PROJECT_REQUEST_BY_FILE_PATH
    ),
    switchMap(({ filePath }) =>
      from(parseProjectJson(filePath)).pipe(
        flatMap(parse => {
          if (parse.errors) throw new Error(parse.errors.join('\n\n'))

          const { project } = normalizeProjectJson(state$.value, parse.value)
          return from([
            r.abortFileDeletions(),
            r.openFileRequest(project, filePath),
          ])
        }),
        catchError(err =>
          of(r.errorDialog('Problem opening project file:', err.message))
        )
      )
    )
  )

const saveProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, SaveProjectRequest>(A.SAVE_PROJECT_REQUEST),
    filter(() => {
      const projectMetadata = r.getCurrentProject(state$.value)
      if (!projectMetadata)
        return Boolean({ type: 'NOOP_SAVE_PROJECT_WITH_NONE_OPEN' })
      const projectFile = r.getFileAvailabilityById(
        state$.value,
        'ProjectFile',
        projectMetadata.id
      )
      return Boolean(
        projectFile &&
          projectFile.filePath &&
          fs.existsSync(projectFile.filePath)
      )
    }), // while can't find project file path in storage, or file doesn't exist
    flatMap(async () => {
      try {
        const projectMetadata = r.getCurrentProject(state$.value)
        if (!projectMetadata) throw new Error('Could not find project metadata')

        const projectFile = r.getFileAvailabilityById(
          state$.value,
          'ProjectFile',
          projectMetadata.id
        ) as CurrentlyLoadedFile

        await writeFile(
          projectFile.filePath,
          r.getProjectFileContents(state$.value, projectMetadata)
        )

        return from([
          r.setWorkIsUnsaved(false),
          r.commitFileDeletions(),
          r.simpleMessageSnackbar(`Project saved in ${projectFile.filePath}`),
        ])
      } catch (err) {
        console.error(err)
        return of(
          r.simpleMessageSnackbar(`Problem saving project file: ${err.message}`)
        )
      }
    }),
    mergeAll()
  )

const PROJECT_EDIT_ACTIONS = [
  A.DELETE_CARD,
  A.MAKE_CLIPS_FROM_SUBTITLES,
  A.DELETE_CARDS,
  A.SET_FLASHCARD_FIELD,
  A.ADD_FLASHCARD_TAG,
  A.DELETE_FLASHCARD_TAG,
  A.EDIT_CLIP,
  A.ADD_CLIP,
  A.ADD_CLIPS,
  A.MERGE_CLIPS,
  A.DELETE_MEDIA_FROM_PROJECT,
  A.LINK_FLASHCARD_FIELD_TO_SUBTITLES_TRACK,
  A.SET_PROJECT_NAME,
] as const

const registerUnsavedWork: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, Action>(...PROJECT_EDIT_ACTIONS),
    filter(() => Boolean(r.getCurrentProjectId(state$.value))),
    map(() => r.setWorkIsUnsaved(true))
  )

const deleteMediaFileFromProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, DeleteMediaFromProject>(A.DELETE_MEDIA_FROM_PROJECT),
    flatMap(({ mediaFileId }) => {
      const file = r.getFile(state$.value, 'MediaFile', mediaFileId)
      return file ? of(r.deleteFileRequest(file.type, file.id)) : empty()
    })
  )

const closeProjectRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.CLOSE_PROJECT_REQUEST),
    map(() => {
      if (r.isWorkUnsaved(state$.value))
        return r.confirmationDialog(
          'Are you sure you want to close this project without saving your work?',
          r.closeProject()
        )
      else {
        effects.setAppMenuProjectSubmenuPermissions(false)

        return r.closeProject()
      }
    })
  )

export default combineEpics(
  createProject,
  openProjectByFilePath,
  openProjectById,
  saveProject,
  registerUnsavedWork,
  // autoSaveProject,
  deleteMediaFileFromProject,
  closeProjectRequest
)
