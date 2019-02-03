import { flatMap, debounce } from 'rxjs/operators'
import { timer } from 'rxjs'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import { promisify } from 'util'
import fs from 'fs'
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
      'ADD_WAVEFORM_SELECTION',
      'ADD_WAVEFORM_SELECTIONS',
      'EDIT_WAVEFORM_SELECTION',
      'MERGE_WAVEFORM_SELECTIONS',
      'ADD_NOTE_TYPE',
      'EDIT_NOTE_TYPE',
      'DELETE_NOTE_TYPE',
      'SET_DEFAULT_NOTE_TYPE'
    ),
    debounce(() => timer(TEN_SECONDS)),
    flatMap(async () => {
      try {
        const filePath = `${r.getCurrentFilePath(state$.value)}.afca.json`
        const json = JSON.stringify(r.getProject0_0_0(state$.value), null, 2)
        await writeFile(filePath, json, 'utf8')
        return { type: 'SAVE PROJECT!!' }
      } catch (err) {
        return r.simpleMessageSnackbar(
          `Problem saving project file: ${err.message}`
        )
      }
    })
  )

export default saveProjectFile
