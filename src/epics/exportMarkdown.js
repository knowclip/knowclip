import { flatMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { of, from } from 'rxjs'
import { promisify } from 'util'
import fs from 'fs'
import * as r from '../redux'
import { showSaveDialog } from '../utils/electron'
import projectToMarkdown from '../utils/sanzijingMarkdown'

const writeFile = promisify(fs.writeFile)

const exportMarkdown = (action$, state$) =>
  action$.pipe(
    ofType('EXPORT_MARKDOWN'),
    flatMap(async ({ clipIds }) => {
      try {
        const filename = await showSaveDialog('Markdown', ['md'])
        if (!filename) return { type: 'NOOP_EXPORT_MARKDOWN' }
        const currentProjectMetadata = r.getCurrentProject(state$.value)
        if (!currentProjectMetadata)
          return of(r.simpleMessageSnackbar('Could not find project'))

        const markdown = projectToMarkdown(
          state$.value,
          currentProjectMetadata.id,
          clipIds
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
