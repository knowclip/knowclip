import { flatMap, debounce, map, filter } from 'rxjs/operators'
import { timer, of, from, Observable } from 'rxjs'
import { ofType, combineEpics, StateObservable } from 'redux-observable'
import * as r from '../redux'
import { promisify } from 'util'
import fs from 'fs'
import parseProject from '../utils/parseProject'
import { saveProjectToLocalStorage } from '../utils/localStorage'
import { AppEpic } from '../types/AppEpic'
import moment from 'moment'

const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const openProject = async (
  filePath: string,
  state$: StateObservable<AppState>
): Promise<Observable<Action>> => {
  try {
    const projectJson = ((await readFile(filePath)) as unknown) as string
    const project = parseProject(projectJson)
    if (!project)
      return of(
        r.simpleMessageSnackbar(
          'Could not read project file. Please make sure your software is up to date and try again.'
        )
      )

    const mediaFiles = project.mediaFiles.map(({ id }) => id)

    return from([
      r.openProject(
        {
          id: project.id,
          type: 'ProjectFile',
          lastSaved: project.timestamp,
          lastOpened: moment()
            .utc()
            .format(),
          name: project.name,
          mediaFileIds: mediaFiles,
          error: null,
          noteType: project.noteType,
        },
        project.clips
      ),
    ])
  } catch (err) {
    console.error(err)
    return of(
      r.simpleMessageSnackbar(`Error opening project file: ${err.message}`)
    )
  }
}

const openProjectById: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, OpenProjectRequestById>(A.OPEN_PROJECT_REQUEST_BY_ID),
    map(({ id }) => {
      const project = r.getFileRecord<ProjectFileRecord>(
        state$.value,
        'ProjectFile',
        id
      )
      if (!project)
        return r.simpleMessageSnackbar(`Could not find project ${id}.`)

      // const { filePath } = project
      // if (!filePath)
      //   return of(
      //     r.simpleMessageSnackbar(`Could not find project at ${filePath}`)
      //   )

      return r.loadFileRequest(project)
    })
    // flatMap<Observable<Action>, Observable<Action>>(x => x)
  )

const openProjectByFilePath: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, OpenProjectRequestByFilePath>(
      A.OPEN_PROJECT_REQUEST_BY_FILE_PATH
    ),
    flatMap<OpenProjectRequestByFilePath, Promise<Observable<Action>>>(
      async ({ filePath }) => {
        const projectIdFromRecents = r.getProjectIdByFilePath(
          state$.value,
          filePath
        )
        if (projectIdFromRecents)
          return of(r.openProjectById(projectIdFromRecents))

        // if (!fs.existsSync(filePath))
        //   return of(r.simpleMessageSnackbar('Could not find project file.'))

        return await openProject(filePath, state$)
      }
    ),
    flatMap(x => x)
  )

const saveProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, SaveProjectRequest>(A.SAVE_PROJECT_REQUEST),
    filter(() => {
      const projectMetadata = r.getCurrentProject(state$.value)
      if (!projectMetadata)
        return Boolean({ type: 'NOOP_SAVE_PROJECT_WITH_NONE_OPEN' })
      const projectFile = r.getLoadedFileById(
        state$.value,
        'ProjectFile',
        projectMetadata.id
      )
      return Boolean(
        projectFile &&
          projectFile.filePath &&
          fs.existsSync(projectFile.filePath)
      )
    }), // while can't find project file path in local storage, or file doesn't exist
    flatMap(async () => {
      try {
        const projectMetadata = r.getCurrentProject(state$.value)
        if (!projectMetadata) throw new Error('Could not find project metadata')
        const json = JSON.stringify(
          r.getProject(state$.value, projectMetadata),
          null,
          2
        )
        const projectFile = r.getLoadedFileById(
          state$.value,
          'ProjectFile',
          projectMetadata.id
        ) as CurrentlyLoadedFile
        await writeFile(projectFile.filePath, json, 'utf8')

        return from([
          r.setWorkIsUnsaved(false),
          r.simpleMessageSnackbar(`Project saved in ${projectFile.filePath}`),
        ])
      } catch (err) {
        console.error(err)
        return of(
          r.simpleMessageSnackbar(`Problem saving project file: ${err.message}`)
        )
      }
    }),
    flatMap(x => x)
  )

const PROJECT_EDIT_ACTIONS = [
  A.DELETE_CARD,
  A.MAKE_CLIPS_FROM_SUBTITLES,
  A.DELETE_CARDS,
  A.SET_FLASHCARD_FIELD,
  A.ADD_FLASHCARD_TAG,
  A.DELETE_FLASHCARD_TAG,
  A.ADD_CLIP,
  A.ADD_CLIPS,
  A.EDIT_CLIP,
  A.MERGE_CLIPS,
  A.ADD_MEDIA_TO_PROJECT,
  A.DELETE_MEDIA_FROM_PROJECT,
  A.ADD_AND_LOAD_FILE,
  A.LOCATE_FILE_SUCCESS, //????
  // 'CREATED NEW PROJECT METADATA',
] as const

const registerUnsavedWork: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, Action>(...PROJECT_EDIT_ACTIONS),
    map(() => r.setWorkIsUnsaved(true))
  )

const THREE_SECONDS = 3000
const autoSaveProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, Action>(...PROJECT_EDIT_ACTIONS),
    debounce(() => timer(THREE_SECONDS)),
    map(() => {
      try {
        const projectMetadata = r.getCurrentProject(state$.value)
        if (!projectMetadata) throw new Error('No project metadata found')

        saveProjectToLocalStorage(r.getProject(state$.value, projectMetadata))

        return ({ type: 'AUTOSAVE' } as unknown) as Action
      } catch (err) {
        console.error(err)
        return r.simpleMessageSnackbar(
          `Problem saving project file: ${err.message}`
        )
      }
    })
  )

// const openMediaFileRequestOnOpenProject: AppEpic = (action$, state$) =>
//   action$.pipe(
//     ofType<Action, OpenProject>(A.OPEN_PROJECT),
//     flatMap(({ fileRecord, project }) => {
//       if (!fileRecord.mediaFiles.length)
//         return of(({
//           type: 'NOOP_OPEN_PROJECT_NO_MEDIA_FILES',
//         } as unknown) as Action)

//       const [firstMediaFile] = project.mediaFiles

//       const clips = Object.values(state$.value.clips.idsByMediaFileId).reduce(
//         (a, b) => a.concat(b),
//         []
//       )

//       const tagsToClipIds: { [tag: string]: ClipId[] } = clips.reduce(
//         (tagsToIds, clipId) => {
//           const clip = r.getClip(state$.value, clipId)
//           if (clip)
//             clip.flashcard.tags.forEach(tag => {
//               tagsToIds[tag] = (tagsToIds[tag] || []) as string[]
//               tagsToIds[tag].push(clip.id)
//             })
//           return tagsToIds
//         },
//         {} as { [tag: string]: ClipId[] }
//       )

//       return from([
//         r.loadFileRequest(firstMediaFile),
//         r.setAllTags(tagsToClipIds),
//       ])
//     })
//   )

// ^ above more recently commented

// const openProjectOnCreate: AppEpic = (action$, state$) =>
//   action$.pipe(
//     ofType<Action, CreateProject>(A.CREATE_PROJECT),
//     flatMap(async ({ fileRecord }) => {
//       try {
//         const json = JSON.stringify(
//           r.getProject(state$.value, fileRecord),
//           null,
//           2
//         )
//         await writeFile(fileRecord, json, 'utf8')

//         return await r.openProjectById(fileRecord.id)
//       } catch (err) {
//         console.error(err)
//         return await r.simpleMessageSnackbar(
//           `Could not create project file: ${err.message}`
//         )
//       }
//     })
//   )

const deleteMediaFileFromProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType<Action, DeleteMediaFromProjectRequest>(
      A.DELETE_MEDIA_FROM_PROJECT_REQUEST
    ),
    flatMap(({ projectId, mediaFileId }) => {
      const highlightedClip = r.getHighlightedClip(state$.value)
      return from([
        ...(highlightedClip ? [r.highlightClip(null)] : []),
        r.deleteMediaFromProject(projectId, mediaFileId),
      ])
    })
  )

const closeProject: AppEpic = (action$, state$) =>
  action$.pipe(
    ofType(A.CLOSE_PROJECT_REQUEST),
    map(() => {
      if (r.isWorkUnsaved(state$.value))
        return r.confirmationDialog(
          'Are you sure you want to close this project without saving your work?',
          r.closeProject()
        )
      else return r.closeProject()
    })
  )

export default combineEpics(
  openProjectByFilePath,
  openProjectById,
  saveProject,
  registerUnsavedWork,
  autoSaveProject,
  // openMediaFileRequestOnOpenProject,
  // openProjectOnCreate,
  deleteMediaFileFromProject,
  closeProject
)
