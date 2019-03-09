import { flatMap, debounce } from 'rxjs/operators'
import { timer } from 'rxjs'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import { promisify } from 'util'
import fs from 'fs'
import { getProjectFilePath } from '../utils/statePersistence'
// import electron from 'electron'

const writeFile = promisify(fs.writeFile)

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

export default saveProjectFile
