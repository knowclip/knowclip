import {
  mergeMap,
  map,
  filter,
  mergeAll,
  switchMap,
  catchError,
} from 'rxjs/operators'
import { of, from, EMPTY } from 'rxjs'
import { ofType, combineEpics } from 'redux-observable'
import A from '../types/ActionType'
import r from '../redux'
import { normalizeProjectJson } from '../utils/normalizeProjectJson'
import { FileUpdateName } from '../files/updates'

const createProject: AppEpic = (
  action$,
  state$,
  { writeFile, nowUtcTimestamp, uuid }
) =>
  action$.pipe(
    ofType(A.createProject as const),
    switchMap(({ name, noteType, filePath }) => {
      const now = nowUtcTimestamp()
      const project: ProjectFile = {
        type: 'ProjectFile',
        id: uuid(),
        name,
        noteType,
        mediaFileIds: [],
        error: null,
        createdAt: now,
        lastSaved: now,
      }

      return from(
        writeFile(
          filePath,
          r.getProjectFileContents(state$.value, project, now)
        )
      ).pipe(
        mergeMap(() =>
          from([
            r.openFileRequest(project, filePath),
            r.setWorkIsUnsaved(false),
          ])
        )
      )
    }),
    catchError((err) =>
      of(
        r.simpleMessageSnackbar(
          'Error creating project file: ' + err.toString()
        )
      )
    )
  )

const openProjectById: AppEpic = (action$, state$, { fileExists }) =>
  action$.pipe(
    ofType(A.openProjectRequestById as const),
    mergeMap(async ({ id }) => {
      const project = r.getFileAvailabilityById<ProjectFile>(
        state$.value,
        'ProjectFile',
        id
      )
      if (!project.filePath || !(await fileExists(project.filePath)).value) {
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
      return r.openProjectRequestByFilePath(project.filePath)
    })
  )

const openProjectByFilePath: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.openProjectRequestByFilePath as const),
    switchMap(({ filePath }) =>
      from(effects.parseProjectJson(filePath)).pipe(
        mergeMap((readResult) => {
          if (readResult.error) throw readResult.error

          const { project } = normalizeProjectJson(
            state$.value,
            readResult.value
          )
          return from([
            r.abortFileDeletions(),
            r.openFileRequest(project, filePath),
          ])
        }),
        catchError((err) => {
          console.log({ err })
          return of(r.errorDialog('Problem opening project file:', err.message))
        })
      )
    )
  )

const saveProject: AppEpic = (
  action$,
  state$,
  { fileExists, writeFile, nowUtcTimestamp }
) =>
  action$.pipe(
    ofType(A.saveProjectRequest as const),
    mergeMap(async () => {
      const projectMetadata = r.getCurrentProject(state$.value)
      if (!projectMetadata)
        return Boolean({ type: 'NOOP_SAVE_PROJECT_WITH_NONE_OPEN' })
      const projectFile = r.getFileAvailabilityById(
        state$.value,
        'ProjectFile',
        projectMetadata.id
      )
      return Boolean(
        projectFile?.filePath && (await fileExists(projectFile.filePath)).value
      )
    }),
    filter((x) => x),
    mergeMap(async () => {
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
          r.getProjectFileContents(
            state$.value,
            projectMetadata,
            nowUtcTimestamp()
          )
        )

        return from([
          r.setWorkIsUnsaved(false),
          r.commitFileDeletions(),
          r.simpleMessageSnackbar(
            `Project saved in ${projectFile.filePath}`,
            5000
          ),
        ])
      } catch (err) {
        console.error(err)
        return of(
          r.simpleMessageSnackbar(`Problem saving project file: ${err}`)
        )
      }
    }),
    mergeAll()
  )

const PROJECT_EDIT_ACTIONS = new Set<Action['type']>([
  A.deleteCard,
  A.makeClipsFromSubtitles,
  A.deleteCards,
  A.setFlashcardField,
  A.addFlashcardTag,
  A.deleteFlashcardTag,
  A.editClip,
  A.stretchClip,
  A.addClip,
  A.addClips,
  A.mergeClips,
  A.moveClip,
  A.addMediaToProjectRequest,
])
const PROJECT_EDIT_UPDATE_FILE_ACTIONS: Set<FileUpdateName> = new Set([
  FileUpdateName.DeleteProjectMedia,
  FileUpdateName.LinkFlashcardFieldToSubtitlesTrack,
  FileUpdateName.SetProjectName,
])

const registerUnsavedWork: AppEpic = (action$, state$) =>
  action$.pipe(
    filter((action) => {
      return (
        (PROJECT_EDIT_ACTIONS.has(action.type) ||
          (action.type === A.updateFile &&
            PROJECT_EDIT_UPDATE_FILE_ACTIONS.has(action.update.updateName))) &&
        Boolean(r.getCurrentProjectId(state$.value))
      )
    }),
    map(() => r.setWorkIsUnsaved(true))
  )

const deleteMediaFileFromProject: AppEpic = (action$, state$) =>
  action$.pipe(
    mergeMap((action) => {
      if (action.type !== A.updateFile) return EMPTY

      if (action.update.updateName !== FileUpdateName.DeleteProjectMedia)
        return EMPTY

      const {
        updatePayload: [mediaFileId],
      } = action.update
      const file = r.getFile(state$.value, 'MediaFile', mediaFileId)
      return file ? of(r.deleteFileRequest(file.type, file.id)) : EMPTY
    })
  )

const closeProjectRequest: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    ofType(A.closeProjectRequest as const),
    map(() => {
      if (r.isWorkUnsaved(state$.value))
        return r.confirmationDialog(
          'Are you sure you want to close this project without saving your work?',
          r.closeProject()
        )
      else {
        effects.sendToMainProcess({
          type: 'setAppMenuProjectSubmenuPermissions',
          args: [false],
        })

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
