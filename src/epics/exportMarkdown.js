import { flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { of, from } from 'rxjs'
import { promisify } from 'util'
import fs from 'fs'
import * as r from '../redux'
import { showSaveDialog } from '../utils/electron'
import projectToMarkdown from '../utils/projectToMarkdown'

const writeFile = promisify(fs.writeFile)

const exportMarkdown = (action$, state$) =>
  action$.pipe(
    ofType('EXPORT_MARKDOWN'),
    flatMap(async () => {
      try {
        const filename = await showSaveDialog('Markdown', ['md'])
        if (!filename) return { type: 'NOOP_EXPORT_MARKDOWN' }
        const currentProjectMetadata = r.getCurrentProject(state$.value)
        if (!currentProjectMetadata)
          return of(r.simpleMessageSnackbar('Could not find project'))
        const noteType = r.getCurrentNoteType(state$.value)
        if (!noteType)
          return of(r.simpleMessageSnackbar('Could not find note type'))

        const markdown = projectToMarkdown(
          state$.value,
          currentProjectMetadata.id,
          noteType
        )
        await writeFile(filename, markdown, 'utf8')
        return from([
          r.simpleMessageSnackbar(`Markdown file saved in ${filename}`),
        ])
      } catch (err) {
        return of(
          r.simpleMessageSnackbar(
            `Problem saving markdown file: ${err.message}`
          )
        )
      }
    }),
    flatMap(x => x)
  )

export default exportMarkdown
