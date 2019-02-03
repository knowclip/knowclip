import { flatMap, ignoreElements } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import electron from 'electron'
import { join } from 'path'
import getCsvText from '../utils/getCsvText'
import fs from 'fs'
import { promisify } from 'util'

const {
  remote: { dialog },
} = electron
const writeFile = promisify(fs.writeFile)

const showDialog = () =>
  new Promise((res, rej) => {
    try {
      dialog.showSaveDialog(
        { filters: [{ name: 'Comma-separated values', extensions: ['csv'] }] },
        filename => {
          res(filename)
        }
      )
    } catch (err) {
      rej(err)
    }
  })

const exportFlashcards = (action$, state$) =>
  action$.pipe(
    ofType('EXPORT_FLASHCARDS'),
    flatMap(async () => {
      try {
        const filename = await showDialog()
        if (!filename) return { type: 'NOOP_EXPORT_FLASHCARDS' }

        const csvText = getCsvText(state$.value)
        await writeFile(filename, csvText, 'utf8')
        return r.simpleMessageSnackbar(`Flashcards saved in ${filename}`)
      } catch (err) {
        return r.simpleMessageSnackbar(
          `Problem saving flashcard: ${err.message}`
        )
      }
    })
  )

export default exportFlashcards
