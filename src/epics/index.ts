import { ignoreElements, mergeMap, tap } from 'rxjs/operators'
import { combineEpics, ofType } from 'redux-observable'
import { of } from 'rxjs'
import A from '../types/ActionType'
import r from '../redux'
import clipCreate from './clipCreate'
import clipwave from './clipwave'
import editClip from './editClip'
import exportCsvAndMp3 from './exportCsvAndMp3'
import exportMarkdown from './exportMarkdown'
import exportApkg from './exportApkg'
import addMediaToProject from './addMediaToProject'
import deleteAllCurrentFileClips from './deleteAllCurrentFileClips'
import keyboard from './keyboard'
import project from './project'
import highlightClip from './highlightClip'
import subtitles from './subtitles'
import subtitlesLinks from './subtitlesLinks'
import files from './files'
import defaultTags from './defaultTags'
import loopMedia from './loopMedia'
import preloadVideoStills from './preloadVideoStills'
import generateWaveformImages from './generateWaveformImages'
import menu from './menu'
import dictionaries from './dictionaries'
import { adjustWaveformViaHistory } from './adjustWaveformViaHistory'

const closeEpic: AppEpic = (
  action$,
  state$,
  { fromIpcRendererEvent, quitApp, showMessageBox }
) =>
  fromIpcRendererEvent('app-close').pipe(
    mergeMap(async () => {
      if (state$.value.session.progress) {
        return await r.promptSnackbar(
          'If you close the app before this operation is finished, you risk losing some data.',
          [
            ['Wait (recommended)', r.closeSnackbar()],
            ['Force close', r.quitApp()],
          ]
        )
      }

      if (
        !r.getCurrentProject(state$.value) ||
        !r.isWorkUnsaved(state$.value)
      ) {
        return await r.quitApp()
      }

      const choice = await showMessageBox({
        type: 'question',
        buttons: ['Cancel', 'Quit'],
        title: 'Confirm',
        message: 'Are you sure you want to quit without saving your work?',
      })
      if (!choice || choice.response === 0) {
        return (await { type: "DON'T QUIT ON ME!!" }) as unknown as Action
      } else {
        quitApp()
        return await r.quitApp()
      }
    })
  )

const initialize: AppEpic = () => of(r.initializeApp())

const quit: AppEpic = (action$, state$, { quitApp }) =>
  action$.pipe(
    ofType(A.quitApp),
    tap(() => {
      quitApp()
    }),
    ignoreElements()
  )

const pauseAndChangeCursorOnBusy: AppEpic = (action$, state$, { pauseMedia }) =>
  action$.pipe(
    ofType(A.setProgress, A.enqueueDialog),
    tap((action) => {
      if (action.type === A.setProgress) {
        document.body.style.cursor = action.progress ? 'progress' : 'default'
      }
      pauseMedia()
    }),
    ignoreElements()
  )

const rootEpic: AppEpic = combineEpics(
  initialize,
  quit,
  addMediaToProject,
  loopMedia,
  editClip,
  clipCreate,
  exportCsvAndMp3,
  exportApkg,
  exportMarkdown,
  deleteAllCurrentFileClips,
  project,
  defaultTags,
  keyboard,
  highlightClip,
  closeEpic,
  subtitles,
  subtitlesLinks,
  files,
  preloadVideoStills,
  generateWaveformImages,
  menu,
  pauseAndChangeCursorOnBusy,
  dictionaries,
  clipwave,
  adjustWaveformViaHistory
)

export default rootEpic
