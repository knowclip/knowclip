import { mergeMap } from 'rxjs/operators'
import { ofType } from 'redux-observable'
import { of, from, Observable } from 'rxjs'
import A from '../types/ActionType'
import r from '../redux'
import projectToMarkdown from '../utils/projectToMarkdown'

const exportMarkdown: AppEpic = (
  action$,
  state$,
  { showSaveDialog, writeFile }
) =>
  action$.pipe(
    ofType(A.exportMarkdown),
    mergeMap<ExportMarkdown, Promise<Observable<Action>>>(async (action) => {
      try {
        const filename = await showSaveDialog('Markdown', ['md'])
        if (!filename)
          return of(({ type: 'NOOP_EXPORT_MARKDOWN' } as unknown) as Action)
        const currentProject = r.getCurrentProject(state$.value)
        if (!currentProject)
          return of(r.simpleMessageSnackbar('Could not find project'))
        const currentNoteType = r.getCurrentNoteType(state$.value)
        if (!currentNoteType) throw new Error('No note type found')
        const markdown = projectToMarkdown(
          state$.value,
          currentProject.id,
          currentNoteType,
          action.mediaFileIdsToClipIds
        )
        await writeFile(filename, markdown, 'utf8')
        return from([
          r.simpleMessageSnackbar(`Markdown file saved in ${filename}`),
        ])
      } catch (err) {
        return of(
          r.simpleMessageSnackbar(`Problem saving markdown file: ${err}`)
        )
      }
    }),
    mergeMap<Observable<Action>, Observable<Action>>((x) => x)
  )

export default exportMarkdown
