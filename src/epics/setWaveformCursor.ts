import { fromEvent, Observable, of, from, empty } from 'rxjs'
import {
  startWith,
  filter,
  switchMap,
  tap,
  ignoreElements,
  flatMap,
} from 'rxjs/operators'
import { setWaveformCursor } from '../actions'
import * as r from '../redux'
import { combineEpics } from 'redux-observable'
import { areSelectionsEqual } from '../utils/waveformSelection'

let seeking = false

const setWaveformCursorEpic: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    filter<Action, OpenMediaFileSuccess>(
      (action): action is OpenMediaFileSuccess =>
        action.type === 'OPEN_FILE_SUCCESS' &&
        action.validatedFile.type === 'MediaFile'
    ),
    switchMap<OpenMediaFileSuccess, Observable<Action>>(() =>
      fromEvent<Event>(
        document,
        'timeupdate',
        // @ts-ignore
        true
      ).pipe(
        flatMap(() => {
          const state = state$.value
          const newlyUpdatedTime = effects.getCurrentTime()

          const selection = r.getWaveformSelection(state)
          const newSelection = r.getNewWaveformSelectionAt(
            state,
            r.getXAtMilliseconds(state, newlyUpdatedTime * 1000)
          )

          const wasSeeking = seeking
          seeking = false

          const loopImminent =
            !wasSeeking &&
            r.isLoopOn(state) &&
            effects.isMediaPlaying() &&
            selection &&
            newlyUpdatedTime >= r.getSecondsAtX(state, selection.item.end)
          if (loopImminent && selection && selection.item) {
            const selectionStartTime = r.getSecondsAtX(
              state,
              selection.item.start
            )
            effects.setCurrentTime(selectionStartTime)
            return empty()
          }

          const setCursorAction = setCursorAndViewBox(
            state,
            newlyUpdatedTime,
            effects.getWaveformSvgWidth(),
            newSelection
          )

          if (newSelection && !areSelectionsEqual(selection, newSelection)) {
            return from([setCursorAction, r.selectWaveformItem(newSelection)])
          }

          if (!newSelection && wasSeeking) {
            return from([setCursorAction, r.clearWaveformSelection()])
          }

          return from([setCursorAction])
        }),
        startWith(setWaveformCursor(0, { xMin: 0 }))
      )
    )
  )

const setCursorAndViewBox = (
  state: AppState,
  newlySetTime: number,
  svgWidth: number,
  newSelection: ReturnType<typeof r.getNewWaveformSelectionAt>
) => {
  const viewBox = state.waveform.viewBox

  const newX = Math.round(newlySetTime * 50)

  const buffer = Math.round(svgWidth * 0.1)

  if (newX < viewBox.xMin) {
    console.log('newX - svgWidth * 0.9', newX - svgWidth * 0.1, {
      newX,
      svgWidth,
    })
    return setWaveformCursor(newX, {
      ...viewBox,
      xMin: Math.max(0, newX - buffer),
    })
  }
  if (newX > svgWidth + viewBox.xMin) {
    const xMin = newSelection ? newSelection.item.end + buffer : newX
    return setWaveformCursor(newX, { ...viewBox, xMin })
  }
  return setWaveformCursor(newX)
}

type OpenMediaFileSuccess = {
  type: 'OPEN_FILE_SUCCESS'
  filePath: string
  validatedFile: MediaFile
  timestamp: string
}

const seekingTrackerEpic: AppEpic = action$ =>
  action$.pipe(
    filter<Action, OpenMediaFileSuccess>(
      (action): action is OpenMediaFileSuccess =>
        action.type === 'OPEN_FILE_SUCCESS' &&
        action.validatedFile.type === 'MediaFile'
    ),
    switchMap<OpenMediaFileSuccess, Observable<Action>>(() =>
      fromEvent<Event>(
        document,
        'seeking',
        // @ts-ignore
        true
      ).pipe(
        tap(() => (seeking = true)),
        startWith(() => of(null).pipe(tap(() => (seeking = false)))),
        ignoreElements()
      )
    )
  )

export default combineEpics(setWaveformCursorEpic, seekingTrackerEpic)
