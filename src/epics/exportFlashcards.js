import { tap, ignoreElements } from 'rxjs/operators'
import { ofType } from 'redux-observable'
// import * as r from '../redux'
import electron from 'electron'
import { join } from 'path'
import getCsvText from '../utils/getCsvText'
import fs from 'fs'
import { promisify } from 'util'

const {
  remote: { dialog },
} = electron
const writeFile = promisify(fs.writeFile)

const exportFlashcards = (action$, state$) =>
  action$.pipe(
    ofType('EXPORT_FLASHCARDS'),
    tap(() => {
      dialog.showOpenDialog({ properties: ['openDirectory'] }, filePaths => {
        if (!filePaths) return

        const [directory] = filePaths
        const csvText = getCsvText(state$.value)
        const csvFilepath = join(directory, 'german_flashcards.csv')
        writeFile(csvFilepath, csvText)
      })
    }),
    ignoreElements()
  )

export default exportFlashcards
