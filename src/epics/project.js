import { flatMap, debounce, map } from 'rxjs/operators'
import { timer, of } from 'rxjs'
import { ofType, combineEpics } from 'redux-observable'
import * as r from '../redux'
import { promisify } from 'util'
import fs from 'fs'
import { getProjectFilePath } from '../utils/statePersistence'
import parseProject from '../utils/parseProject'

// import electron from 'electron'
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

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

      try {
        const projectJson = await readFile(filePath)
        const project = parseProject(projectJson)
        if (!project)
          return of(
            r.simpleMessageSnackbar(
              'Could not read project file. Please make sure your software is up to date and try again.'
            )
          )

        let originalProjectJson: ?Project
        try {
          originalProjectJson = JSON.parse(projectJson)
        } catch (err) {}
        const audioFilePaths =
          originalProjectJson &&
          ['0.0.0', '1.0.0'].includes(originalProjectJson.version)
            ? [
                {
                  id: project.mediaFilesMetadata[0].id,
                  filePath: filePath.replace(/\.afca$/, ''),
                },
              ]
            : project.mediaFilesMetadata.map(({ id }) => ({
                id,
                filePath: null,
              }))
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
        return of(
          r.simpleMessageSnackbar(`Error opening project file: ${err.message}`)
        )
      }
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
      'DELETE_NOTE_TYPE',
      'SET_DEFAULT_NOTE_TYPE'
    ),
    debounce(() => timer(TEN_SECONDS)),
    flatMap(async () => {
      try {
        const audioFilePath = r.getCurrentFilePath(state$.value)
        if (audioFilePath) {
          const projectFilePath = getProjectFilePath(audioFilePath)
          const json = JSON.stringify(r.getProject(state$.value), null, 2)
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
      const [{ id: firstMediaFileId }] = projectMetadata.audioFilePaths
      return r.openMediaFileRequest(firstMediaFileId)
    })
  )

export default combineEpics(
  openProjectByFilePath,
  saveProjectFile,
  openMediaFileRequestOnOpenProject
)
