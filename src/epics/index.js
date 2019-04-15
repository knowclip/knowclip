import { map, flatMap, tap, ignoreElements } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import { ipcRenderer, remote } from 'electron'
import * as r from '../redux'
import getWaveformEpic from './getWaveform'
import setWaveformCursorEpic from './setWaveformCursor'
import addClip from './addClip'
import stretchClip from './stretchClip'
import detectSilenceEpic from './detectSilence'
import exportCsvAndMp3 from './exportCsvAndMp3'
import exportMarkdown from './exportMarkdown'
import exportApkg from './exportApkg'
import noteTypesEpic from './noteTypes'
import { toWaveformCoordinates } from '../utils/waveformCoordinates'
import persistStateEpic from './persistState'
import media from './media'
import deleteAllCurrentFileClips from './deleteAllCurrentFileClips'
import keyboard from './keyboard'
import project from './project'
import highlightClip from './highlightClip'

const defaultTagsEpic = (action$, state$) =>
  action$.pipe(
    ofType('ADD_FLASHCARD_TAG', 'DELETE_FLASHCARD_TAG'),
    map(({ id }) => ({
      type: 'SET_DEFAULT_TAGS',
      tags: r.getClip(state$.value, id).flashcard.tags,
    }))
  )

// const defaultTagsAudioEpic = (action$, state$) =>
//   action$.pipe(
//     ofType('LOAD_AUDIO_SUCCESS'),
//     filter(({ file }) => file),
//     map(({ id }) => ({
//       type: 'SET_DEFAULT_TAGS',
//       tags: [basename(r.getCurrentFileName(state$.value))],
//     }))
//   )

const waveformMousedownEpic = (action$, state$) =>
  action$.pipe(
    ofType('OPEN_MEDIA_FILE_SUCCESS'),
    flatMap(() =>
      fromEvent(document.getElementById('waveform-svg'), 'mousedown').pipe(
        tap(e => e.preventDefault()),
        map(mousedown => ({
          type: 'WAVEFORM_MOUSEDOWN',
          ...toWaveformCoordinates(
            mousedown,
            mousedown.currentTarget,
            r.getWaveformViewBoxXMin(state$.value)
          ),
        }))
      )
    )
  )

const closeEpic = (action$, state$) =>
  fromEvent(ipcRenderer, 'app-close', () => {
    if (
      !r.getCurrentProject(state$.value) ||
      !state$.value.user.workIsUnsaved
    ) {
      ipcRenderer.send('closed')
      return { type: 'QUIT_APP' }
    }

    const choice = remote.dialog.showMessageBox({
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm',
      message: 'Are you sure you want to quit without saving your work?',
    })
    if (choice === 1) {
      // e.preventDefault()
      return { type: "DON'T QUIT ON ME!!" }
    } else {
      ipcRenderer.send('closed')
      return { type: 'QUIT_APP' }
    }
  }).pipe(ignoreElements())

export default combineEpics(
  media,
  getWaveformEpic,
  setWaveformCursorEpic,
  waveformMousedownEpic,
  addClip,
  stretchClip,
  detectSilenceEpic,
  persistStateEpic,
  exportCsvAndMp3,
  exportApkg,
  exportMarkdown,
  deleteAllCurrentFileClips,
  project,
  noteTypesEpic,
  defaultTagsEpic,
  keyboard,
  highlightClip,
  closeEpic
)
