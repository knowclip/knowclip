import { flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import * as r from '../redux'
import getCsvText from '../utils/getCsvText'
import { showSaveDialog } from '../utils/electron'
import { promisify } from 'util'
import fs from 'fs'

const writeFile = promisify(fs.writeFile)

const exportFlashcards = (action$, state$) =>
  action$.pipe(
    ofType('EXPORT_FLASHCARDS'),
    flatMap(async () => {
      try {
        const filename = await showSaveDialog('Comma-separated values', ['csv'])
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
