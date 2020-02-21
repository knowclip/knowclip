import { fromEvent, Observable, of, from } from 'rxjs'
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
    switchMap<OpenMediaFileSuccess, Observable<Action>>(({ validatedFile }) =>
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
          }

          if (wasSeeking && !areSelectionsEqual(selection, newSelection)) {
            return from([
              ...(!newSelection
                ? [
                    setCursorAndViewBox(
                      state,
                      newlyUpdatedTime,
                      effects.getWaveformSvgWidth()
                    ),
                  ]
                : []),
              r.selectWaveformItem(newSelection),
            ])
          }

          if (
            !loopImminent &&
            newSelection &&
            !areSelectionsEqual(selection, newSelection)
          )
            return of(r.selectWaveformItem(newSelection))

          return of(
            setCursorAndViewBox(
              state,
              newlyUpdatedTime,
              effects.getWaveformSvgWidth()
            )
          )
        }),
        startWith(setWaveformCursor(0, { xMin: 0 }))
      )
    )
  )

const setCursorAndViewBox = (
  state: AppState,
  newlySetTime: number,
  svgWidth: number
) => {
  const viewBox = state.waveform.viewBox

  const newX = Math.round(newlySetTime * 50)

  if (newX < viewBox.xMin) {
    return setWaveformCursor(newX, {
      ...viewBox,
      xMin: Math.max(0, newX - svgWidth * 0.9),
    })
  }
  if (newX > svgWidth + viewBox.xMin) {
    return setWaveformCursor(newX, { ...viewBox, xMin: newX })
  }
  return setWaveformCursor(newX)
}

type OpenMediaFileSuccess = {
  type: 'OPEN_FILE_SUCCESS'
  filePath: string
  validatedFile: MediaFile
  timestamp: string
}

const seekingTrackerEpic: AppEpic = (action$, state$, effects) =>
  action$.pipe(
    filter<Action, OpenMediaFileSuccess>(
      (action): action is OpenMediaFileSuccess =>
        action.type === 'OPEN_FILE_SUCCESS' &&
        action.validatedFile.type === 'MediaFile'
    ),
    switchMap<OpenMediaFileSuccess, Observable<Action>>(({ validatedFile }) =>
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
