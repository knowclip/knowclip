import { flatMap, debounce, map } from 'rxjs/operators'
import { timer, of } from 'rxjs'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import { promisify } from 'util'
import fs from 'fs'
import { getProjectFilePath } from '../utils/statePersistence'
import parseProject, { getAudioFilePaths } from '../utils/parseProject'

// import electron from 'electron'
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const openProject = async (filePath, projectId, state$) => {
  try {
    const projectJson = await readFile(filePath)
    const project = {
      ...parseProject(projectJson), // why is the media metadata from here giving a random audio file id?
      ...(projectId ? { id: projectId } : null),
    }
    if (!project)
      return of(
        r.simpleMessageSnackbar(
          'Could not read project file. Please make sure your software is up to date and try again.'
        )
      )
    let originalProjectJson = JSON.parse(projectJson)
    // const audioFilePaths =
    //   originalProjectJson &&
    //   ['0.0.0', '1.0.0'].includes(originalProjectJson.version)
    //     ? [
    //         {
    //           metadata: project.mediaFilesMetadata[0],
    //           filePath: filePath.replace(/\.afca$/, ''),
    //         },
    //       ]
    //     : project.mediaFilesMetadata.map((metadata) => ({
    //         metadata,
    //         filePath: null,
    //       }))
    const audioFilePaths = getAudioFilePaths(
      originalProjectJson,
      project,
      filePath
    )
    const projectMetadata: ProjectMetadata = r.getProjectMetadata(
      state$.value,
      project.id
    ) || {
      id: project.id,
      filePath: filePath,
      name: project.name,
      audioFilePaths,
      error: null,
    }
    return of(r.openProject(project, projectMetadata))
  } catch (err) {
    console.error(err)
    return of(
      r.simpleMessageSnackbar(`Error opening project file: ${err.message}`)
    )
  }
}

const openProjectById = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_PROJECT_REQUEST_BY_ID'),
    flatMap(async ({ id }) => {
      const project = r.getProjectMetadata(state$.value, id)
      if (!project)
        return of(r.simpleMessageSnackbar(`Could not find project ${id}.`))

      const { filePath } = project
      if (!filePath)
        return of(
          r.simpleMessageSnackbar(`Could not find project at ${filePath}`)
        )

      return await openProject(filePath, id, state$)
    }),
    flatMap(x => x)
  )

const openProjectByFilePath = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_PROJECT_REQUEST_BY_FILE_PATH'),
    flatMap(async ({ filePath }) => {
      const projectIdFromRecents = r.getProjectIdByFilePath(
        state$.value,
        filePath
      )
      if (projectIdFromRecents)
        return of(r.openProjectById(projectIdFromRecents))

      if (!fs.existsSync(filePath))
        return of(r.simpleMessageSnackbar('Could not find project file.'))

      return await openProject(filePath, null, state$)
    }),
    flatMap(x => x)
  )

const TEN_SECONDS = 3000
const saveProjectFile = (action$, state$) =>
  action$.pipe(
    ofType(
      'DELETE_CARD',
      'MAKE_CLIPS',
      'DELETE_CARDS',
      'SET_FLASHCARD_FIELD',
      'ADD_FLASHCARD_TAG',
      'DELETE_FLASHCARD_TAG',
      'ADD_CLIP',
      'ADD_CLIPS',
      'EDIT_CLIP',
      'MERGE_CLIPS',
      'ADD_NOTE_TYPE',
      'EDIT_NOTE_TYPE',
      'DELETE_NOTE_TYPE'
    ),
    debounce(() => timer(TEN_SECONDS)),
    flatMap(async () => {
      try {
        const audioFilePath = r.getCurrentFilePath(state$.value)
        if (audioFilePath) {
          const projectFilePath = getProjectFilePath(audioFilePath)
          const json = JSON.stringify(
            r.getProject(state$.value, r.getCurrentProject(state$.value)),
            null,
            2
          )
          await writeFile(projectFilePath, json, 'utf8')
          return { type: 'SAVE PROJECT!!' }
        }
        return { type: 'NO AUDIO FILE! NOT SAVING ANY PROJECT' }
      } catch (err) {
        return r.simpleMessageSnackbar(
          `Problem saving project file: ${err.message}`
        )
      }
    })
  )

const openMediaFileRequestOnOpenProject = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_PROJECT'),
    map(({ projectMetadata }) => {
      if (!projectMetadata.audioFilePaths.length)
        return { type: 'NOOP_OPEN_PROJECT_NO_AUDIO_FILES' }

      const [
        {
          metadata: { id: firstMediaFileId },
        },
      ] = projectMetadata.audioFilePaths
      return r.openMediaFileRequest(firstMediaFileId)
    })
  )

const openProjectOnCreate = (action$, state$) =>
  action$.pipe(
    ofType('CREATE_PROJECT'),
    flatMap(async ({ projectMetadata }) => {
      try {
        const json = JSON.stringify(
          r.getProject(state$.value, projectMetadata),
          null,
          2
        )
        await writeFile(projectMetadata.filePath, json, 'utf8')

        return await r.openProjectById(projectMetadata.id)
      } catch (err) {
        console.error(err)
        return await r.simpleMessageSnackbar(
          `Could not create project file: ${err.message}`
        )
      }
    })
  )

export default combineEpics(
  openProjectByFilePath,
  openProjectById,
  saveProjectFile,
  openMediaFileRequestOnOpenProject,
  openProjectOnCreate
)
