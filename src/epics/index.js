import { filter, map, flatMap, tap, ignoreElements } from 'rxjs/operators'
import { ofType, combineEpics } from 'redux-observable'
import { Observable } from 'rxjs'
import { setWaveformPath } from '../actions'
import { getFlashcard } from '../selectors'
import getWaveform from '../utils/getWaveform'
import { setLocalFlashcard } from '../utils/localFlashcards'

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
