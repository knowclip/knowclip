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
import { setCursorX } from '../utils/waveform'
import { overlapsSignificantly } from '../selectors'

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
          const possibleNewSelection = r.getNewWaveformSelectionAt(
            state,
            r.getXAtMilliseconds(state, newlyUpdatedTime * 1000)
          )
          const newSelection =
            selection &&
            selection.type === 'Clip' &&
            possibleNewSelection &&
            possibleNewSelection.type === 'Preview'
              ? overlapsSignificantly(
                  possibleNewSelection.item,
                  selection.item.start,
                  selection.item.end,
                  r.getHalfSecond(state$.value)
                )
                ? null
                : possibleNewSelection
              : possibleNewSelection

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
            setCursorX(selection.item.start)
            return of(setWaveformCursor(selection.item.start))
          }

          const setViewboxAction = setViewBox(
            state,
            newlyUpdatedTime,
            effects.getWaveformSvgWidth(),
            newSelection,
            wasSeeking
          )

          if (newSelection && !areSelectionsEqual(selection, newSelection)) {
            return from([
              ...setViewboxAction,
              r.selectWaveformItem(newSelection),
            ])
          }

          if (!newSelection && wasSeeking) {
            return from([...setViewboxAction, r.clearWaveformSelection()])
          }

          return from(setViewboxAction)
        }),
        startWith(setWaveformCursor(0, { xMin: 0 }))
      )
    )
  )

const setViewBox = (
  state: AppState,
  newlySetTime: number,
  svgWidth: number,
  newSelection: ReturnType<typeof r.getNewWaveformSelectionAt>,
  seeking: boolean
) => {
  const viewBox = state.waveform.viewBox

  const newX = Math.round(newlySetTime * 50)

  const buffer = Math.round(svgWidth * 0.1)

  if (newX < viewBox.xMin) {
    return [
      setWaveformCursor(newX, {
        ...viewBox,
        xMin: Math.max(0, newX - buffer),
      }),
    ]
  }
  if (newX >= svgWidth + viewBox.xMin) {
    const xMin = Math.min(
      newSelection ? newSelection.item.end + buffer : newX,
      Math.max(state.waveform.length - svgWidth, 0)
    )
    return [setWaveformCursor(newX, { ...viewBox, xMin })]
  }
  return seeking ? [setWaveformCursor(newX)] : []
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
