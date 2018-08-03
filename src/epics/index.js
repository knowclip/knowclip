import { filter, map, flatMap, tap, ignoreElements } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { Observable } from 'rxjs'
import getWaveform from '../getWaveform'
import { setWaveformPath } from '../actions'
import { getFlashcard } from '../selectors'
import { setLocalFlashcard } from '../localFlashcards'

const getWaveformEpic = (action$) => action$.pipe(
  ofType('LOAD_AUDIO'),
  flatMap(({ file }) => getWaveform(file)
    .then((svgPath) => setWaveformPath(svgPath)))
)

const setLocalFlashcardEpic = (action$, state$) => action$.pipe(
  ofType('SET_FLASHCARD_FIELD'),
  tap(({ id, key, value }) => {
    const flashcard = getFlashcard(state$.value, id)
    setLocalFlashcard({ ...flashcard, [key]: value })
  }),
  ignoreElements()
)

export default combineEpics(
  getWaveformEpic,
  setLocalFlashcardEpic,
)
