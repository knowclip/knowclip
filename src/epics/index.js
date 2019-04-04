import { map, flatMap, tap, ignoreElements } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { fromEvent } from 'rxjs'
import { ipcRenderer } from 'electron'
import * as r from '../redux'
import getWaveformEpic from './getWaveform'
import setWaveformCursorEpic from './setWaveformCursor'
import addClip from './addClip'
import stretchClip from './stretchClip'
import detectSilenceEpic from './detectSilence'
import makeClipsEpic from './makeClips'
import exportFlashcardsEpic from './exportFlashcards'
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
    ipcRenderer.send('closed')
  }).pipe(ignoreElements())

export default combineEpics(
  media,
  getWaveformEpic,
  setWaveformCursorEpic,
  waveformMousedownEpic,
  addClip,
  stretchClip,
  makeClipsEpic,
  detectSilenceEpic,
  persistStateEpic,
  exportFlashcardsEpic,
  deleteAllCurrentFileClips,
  project,
  noteTypesEpic,
  defaultTagsEpic,
  keyboard,
  highlightClip,
  closeEpic
)
