import { ignoreElements, flatMap } from 'rxjs/operators'
import { combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import { ipcRenderer, remote } from 'electron'
import * as r from '../redux'
import setWaveformCursorEpic from './setWaveformCursor'
import addClip from './addClip'
import stretchClip from './stretchClip'
import detectSilenceEpic from './detectSilence'
import exportCsvAndMp3 from './exportCsvAndMp3'
import exportMarkdown from './exportMarkdown'
import exportApkg from './exportApkg'
import persistStateEpic from './persistState'
import addMediaToProject from './addMediaToProject'
import deleteAllCurrentFileClips from './deleteAllCurrentFileClips'
import keyboard from './keyboard'
import project from './project'
import highlightClip from './highlightClip'
import subtitles from './subtitles'
import files from './files'
import defaultTags from './defaultTags'
import { AppEpic } from '../types/AppEpic'

const closeEpic: AppEpic = (action$, state$) =>
  fromEvent(ipcRenderer, 'app-close', async () => {
    if (!r.getCurrentProject(state$.value) || !r.isWorkUnsaved(state$.value)) {
      ipcRenderer.send('closed')
      return await { type: 'QUIT_APP' }
    }

    const choice = await remote.dialog.showMessageBox({
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm',
      message: 'Are you sure you want to quit without saving your work?',
    })
    if (choice.response === 1) {
      // e.preventDefault()
      return await { type: "DON'T QUIT ON ME!!" }
    } else {
      ipcRenderer.send('closed')
      return await { type: 'QUIT_APP' }
    }
  }).pipe(
    flatMap(x => x),
    ignoreElements()
  )

const rootEpic: AppEpic = combineEpics(
  addMediaToProject,
  setWaveformCursorEpic,
  addClip,
  stretchClip,
  detectSilenceEpic,
  persistStateEpic,
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
  files
)

export default rootEpic
